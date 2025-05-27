/* ──────────────────────────────────────────────────────────────
   src/analysis/analysis.service.ts
   - pełny dump przy pierwszej wiadomości
   - kolejne pytania lecą w obrębie conversationId (bez dumpu)
   - trzy warianty kompresji promptu (CSV / DICT / DELTA)
   ────────────────────────────────────────────────────────────── */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { LawOfficePersistService } from '../law-offices/law-office-persist.service';
import { LawOffice } from '../law-offices/law-office.entity';

import { buildPrompt, PromptMode } from './build-prompt';

/* prościutka pamięć rozmów; w prodzie zastąp Redisem */
@Injectable()
export class ChatSessionService {
  private store = new Map<string, any[]>(); // conversationId → msgs
  private max = 50;

  get(id: string) {
    return this.store.get(id) ?? [];
  }

  create(initMsgs: any[]): string {
    const id = crypto.randomUUID();
    this.store.set(id, initMsgs.slice(-this.max));
    return id;
  }

  push(id: string, msg: any) {
    const arr = this.store.get(id);
    if (!arr) return;
    arr.push(msg);
    if (arr.length > this.max) arr.shift();
  }
}

@Injectable()
export class AnalysisService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model =
    process.env.GROQ_MODEL ?? 'deepseek-r1-distill-llama-70b';

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
    private readonly sessions: ChatSessionService,
  ) {}

  /* ---------------- podsumowanie (2 zdania) ---------------- */
  async summarize(
    city: string,
    type: string,
    limit: number,
  ): Promise<{ summary: string }> {
    const offices = await this.fetchOffices(city, type, limit);

    const prompt = buildPrompt(
      offices,
      offices.length > 2_000
        ? PromptMode.DELTA
        : offices.length > 200
          ? PromptMode.DICT_ID
          : PromptMode.CSV,
    );

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `
            Odpowiedz dokładnie dwoma zdaniami po polsku.
            Pierwsze zdanie zawsze: "Otrzymałem ${offices.length} ${type} (dostosuj to słowo "${type}" do składni zdania) rekordów z ${city}."
            W drugim: Zwięzłe podsumowanie opinii.
          `,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    };

    const { data } = await firstValueFrom(
      this.http.post(this.endpoint, body, this.headers()),
    );

    const raw = data.choices?.[0]?.message?.content ?? '';
    return { summary: raw.replace(/\[END]$/i, '').trim() };
  }

  /* ---------------- chat z sesją ---------------- */
  async chat(
    city: string,
    type: string,
    limit: number,
    question: string,
    conversationId?: string,
  ): Promise<{ answer: string; conversationId: string }> {
    if (!question?.trim())
      throw new HttpException('Puste pytanie', HttpStatus.BAD_REQUEST);

    /* 1) weź historię albo startuj nową */
    const msgs = conversationId ? this.sessions.get(conversationId) : [];

    /* 2) jeśli to nowa rozmowa – dokładamy dump bazy */
    if (!conversationId) {
      const offices = await this.fetchOffices(city, type, limit);
      const prompt = buildPrompt(
        offices,
        offices.length > 2_000
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

    /* 3) pytanie użytkownika */
    msgs.push({ role: 'user', content: question });

    /* 4) wywołanie LLM */
    const { data } = await firstValueFrom(
      this.http.post(
        this.endpoint,
        {
          model: this.model,
          messages: msgs,
          max_tokens: 3000,
          temperature: 0.0,
        },
        this.headers(),
      ),
    );

    const reply = data.choices[0].message;
    msgs.push(reply);

    /* 5) zapisz / utwórz sesję */
    if (conversationId) this.sessions.push(conversationId, reply);
    else conversationId = this.sessions.create(msgs);

    return {
      answer: reply.content?.trim() ?? '',
      conversationId,
    };
  }

  /* ---------------- helpers ---------------- */
  private headers() {
    return {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };
  }

  private async fetchOffices(
    city: string,
    type: string,
    limit: number,
  ): Promise<LawOffice[]> {
    const offices = await this.persist.find(city, type, limit);
    if (!offices.length)
      throw new HttpException(
        'Brak danych – odśwież scraper',
        HttpStatus.NOT_FOUND,
      );
    return offices;
  }
}
