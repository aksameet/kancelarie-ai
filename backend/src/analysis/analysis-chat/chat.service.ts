// src/analysis/chat.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ChatSessionService } from 'src/chat/chat-session.service';
import { LawOfficePersistService } from 'src/law-offices/law-office-persist.service';
import { buildPrompt, PromptMode } from '../build-prompt';

@Injectable()
export class ChatService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model = process.env.GROQ_MODEL;

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
      throw new HttpException('Puste pytanie', HttpStatus.BAD_REQUEST);
    }

    // 1) Pobierz historię albo przygotuj nową
    const msgs = conversationId ? this.sessions.get(conversationId) : [];

    // 2) Przy nowej sesji załaduj dump danych
    if (!conversationId) {
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

    // 3) Dodaj pytanie użytkownika
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
      // Obsługa błędów HTTP z Axios
      if ((err as AxiosError).isAxiosError) {
        const axiosErr = err as AxiosError;
        const resp = axiosErr.response;
        // komunikat z Groq/OpenAI lub domyślny
        const groqMsg = (resp?.data as any)?.message || axiosErr.message;
        // najpierw spróbuj z nagłówka Retry-After
        const headerRetry = resp?.headers?.['retry-after'];
        // jeśli brak nagłówka, parsuj z tekstu "in XXs"
        const fromMsg = /in\s*([\d.]+)s/i.exec(groqMsg);
        const retryAfter = headerRetry
          ? Math.ceil(+headerRetry)
          : fromMsg
            ? Math.ceil(parseFloat(fromMsg[1]))
            : undefined;

        // rzucenie wyjątku z payloadem { message, retryAfter }
        throw new HttpException(
          { message: groqMsg, retryAfter },
          resp?.status || HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Inny, nieoczekiwany błąd
      throw new HttpException(
        'Nieznany błąd przy wywołaniu AI',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 4) Przetwarzanie odpowiedzi i zapis w sesji
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
      throw new HttpException(
        'Brak danych – odśwież scraper',
        HttpStatus.NOT_FOUND,
      );
    }
    return offices;
  }
}
