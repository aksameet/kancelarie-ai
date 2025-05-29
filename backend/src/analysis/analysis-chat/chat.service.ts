// src/analysis/chat.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ChatSessionService } from 'src/chat/chat-session.service';
import { LawOfficePersistService } from 'src/law-offices/law-office-persist.service';
import { buildPrompt, PromptMode } from '../build-prompt';

interface AiErrorPayload {
  status: number;
  error: string;
  message: string;
  retryAfter?: number;
  originalError?: any;
}

@Injectable()
export class ChatService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model = process.env.GROQ_MODEL!;

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
    private readonly sessions: ChatSessionService,
  ) {}

  async chat(
    city: string,
    type: string,
    limit: number,
    question: string,
    conversationId?: string,
  ): Promise<{ answer: string; conversationId: string }> {
    if (!question?.trim()) {
      throw new HttpException(
        { status: 400, error: 'BAD_REQUEST', message: 'Puste pytanie' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const msgs = conversationId ? this.sessions.get(conversationId) : [];
    const hasDump = msgs.some(
      (m: any) => m.role === 'system' && m.name === 'database_dump',
    );

    if (!hasDump) {
      msgs.push({
        role: 'system',
        name: 'language_instruction',
        content: 'Odpowiadaj zawsze po polsku.',
      });
      const offices = await this.fetchOffices(city, type, limit);
      const prompt = buildPrompt(
        offices,
        offices.length > 2000
          ? PromptMode.DELTA
          : offices.length > 200
            ? PromptMode.DICT_ID
            : PromptMode.CSV,
      );
      msgs.push({
        role: 'system',
        name: 'database_dump',
        content: prompt,
      });
    }

    msgs.push({ role: 'user', content: question });

    let responseData: any;
    try {
      const { data } = await firstValueFrom(
        this.http.post(
          this.endpoint,
          {
            model: this.model,
            messages: msgs,
            max_tokens: 3000,
            temperature: 0,
          },
          this.headers(),
        ),
      );
      responseData = data;
    } catch (err) {
      if ((err as AxiosError).isAxiosError) {
        const axiosErr = err as AxiosError;
        const resp = axiosErr.response!;
        const originalMsg = (resp.data as any)?.message || axiosErr.message;
        const headerRetry = resp.headers?.['retry-after'];
        const fromMsg = /in\s*([\d.]+)s/i.exec(originalMsg);
        const retryAfter = headerRetry
          ? Math.ceil(+headerRetry)
          : fromMsg
            ? Math.ceil(parseFloat(fromMsg[1]))
            : undefined;

        let payload: AiErrorPayload = {
          status: resp.status,
          error: HttpStatus[resp.status] || 'ERROR',
          message: originalMsg,
          retryAfter,
          originalError: resp.data,
        };

        if (resp.status === HttpStatus.TOO_MANY_REQUESTS) {
          payload = {
            status: 429,
            error: 'TOO_MANY_REQUESTS',
            message:
              'Przekroczono limit zapytań do AI. Spróbuj ponownie za chwilę.',
            retryAfter,
            originalError: resp.data,
          };
        } else if (
          resp.status === HttpStatus.GATEWAY_TIMEOUT ||
          resp.status === 524
        ) {
          payload = {
            status: 504,
            error: 'GATEWAY_TIMEOUT',
            message: 'Upłynął czas oczekiwania na odpowiedź od AI.',
            originalError: resp.data,
          };
        }

        throw new HttpException(payload, resp.status);
      }

      const payload: AiErrorPayload = {
        status: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Nieznany błąd przy wywołaniu AI',
        originalError: err,
      };
      throw new HttpException(payload, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const reply = responseData.choices[0].message;
    msgs.push(reply);

    if (conversationId) {
      this.sessions.push(conversationId, reply);
    } else {
      conversationId = this.sessions.create(msgs);
    }

    return {
      answer: reply.content?.trim() ?? '',
      conversationId,
    };
  }

  private headers() {
    return {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };
  }

  private async fetchOffices(city: string, type: string, limit: number) {
    const offices = await this.persist.find(city, type, limit);
    if (!offices.length) {
      const payload: AiErrorPayload = {
        status: 404,
        error: 'NOT_FOUND',
        message: 'Brak danych – odśwież scraper',
      };
      throw new HttpException(payload, HttpStatus.NOT_FOUND);
    }
    return offices;
  }
}
