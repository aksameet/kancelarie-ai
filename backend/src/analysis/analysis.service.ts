/* ──────────────────────────────────────────────────────────────
   src/analysis/analysis.service.ts
   Wersja  “pełna baza + kompaktowe formaty CSV / DICT / DELTA”
   ────────────────────────────────────────────────────────────── */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { LawOfficePersistService } from '../law-offices/law-office-persist.service';
import { LawOffice } from '../law-offices/law-office.entity';

/* util do budowy promptu z trzema trybami */
import { buildPrompt, PromptMode } from './build-prompt';

@Injectable()
export class AnalysisService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY ?? '';
  private readonly model =
    process.env.GROQ_MODEL ?? 'deepseek-r1-distill-llama-70b';

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
  ) {}

  /* ------------------------------------------------------------
     1) PODSUMOWANIE  – dokładnie 2 zdania
     ------------------------------------------------------------ */
  async summarize(
    city: string,
    type: string,
    limit: number,
  ): Promise<{ summary: string }> {
    const offices = await this.fetchOffices(city, type, limit);

    /* wybór najbardziej kompaktowego formatu */
    const mode =
      offices.length > 2_000
        ? PromptMode.DELTA
        : offices.length > 200
          ? PromptMode.DICT_ID
          : PromptMode.CSV;

    const prompt = buildPrompt(offices, mode);

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

  /* ------------------------------------------------------------
     2) CHAT  – dowolne pytania
     ------------------------------------------------------------ */
  async chat(
    city: string,
    type: string,
    limit: number,
    question: string,
  ): Promise<{ answer: string }> {
    if (!question?.trim())
      throw new HttpException('Puste pytanie', HttpStatus.BAD_REQUEST);

    const offices = await this.fetchOffices(city, type, limit);

    const mode =
      offices.length > 2_000
        ? PromptMode.DELTA
        : offices.length > 200
          ? PromptMode.DICT_ID
          : PromptMode.CSV;

    const prompt = buildPrompt(offices, mode);

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `
Odpowiadasz zwięźle po polsku
bazując WYŁĄCZNIE na danych przesłanych w kolejnej wiadomości
(system:name="database_dump").
          `.trim(),
        },
        {
          role: 'system',
          name: 'database_dump',
          content: prompt,
        },
        { role: 'user', content: question },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    };

    const { data } = await firstValueFrom(
      this.http.post(this.endpoint, body, this.headers()),
    );

    return { answer: data.choices?.[0]?.message?.content?.trim() ?? '' };
  }

  /* ------------------------------------------------------------
     helpers
     ------------------------------------------------------------ */
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
    if (!this.apiKey)
      throw new HttpException('GROQ_API_KEY missing', HttpStatus.BAD_REQUEST);

    const offices = await this.persist.find(city, type, limit);
    if (!offices.length)
      throw new HttpException(
        'Brak danych w bazie – odśwież scraper',
        HttpStatus.NOT_FOUND,
      );
    return offices;
  }
}
