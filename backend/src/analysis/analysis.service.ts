import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { LawOfficePersistService } from '../law-offices/law-office-persist.service';
import { LawOffice } from '../law-offices/law-office.entity';

@Injectable()
export class AnalysisService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model =
    process.env.GROQ_MODEL ?? 'deepseek-r1-distill-llama-70b';

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
  ) {}

  /* ----------------  dotychczasowy skrót  ---------------- */
  async summarize(
    city: string,
    type: string,
    limit: number,
  ): Promise<{ summary: string }> {
    const offices = await this.fetchOffices(city, type, limit);
    const prompt = this.buildPrompt(offices);

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
    return { summary: raw.split('[END]')[0].trim() };
  }

  /* ----------------  NOWY CHAT  ---------------- */
  async chat(
    city: string,
    type: string,
    limit: number,
    question: string,
  ): Promise<{ answer: string }> {
    if (!question?.trim())
      throw new HttpException('Puste pytanie', HttpStatus.BAD_REQUEST);

    const offices = await this.fetchOffices(city, type, limit);
    const prompt = this.buildPrompt(offices);

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `
            Odpowiadasz rzeczowo i zwięźle po polsku, bazując wyłącznie na danych przesłanych
            przez użytkownika (lista kancelarii poniżej). Nie ujawniasz
            swojego procesu myślowego ani tagów. Maks 300 znaków.
          `,
        },
        {
          role: 'system',
          name: 'database_dump',
          content: prompt,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    };

    const { data } = await firstValueFrom(
      this.http.post(this.endpoint, body, this.headers()),
    );

    const answer = data.choices?.[0]?.message?.content?.trim() ?? '';
    return { answer };
  }

  /* ----------------  helpers  ---------------- */
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

  private buildPrompt(offices: LawOffice[]): string {
    return offices
      .map(
        (o, i) =>
          `[${i + 1}] ${o.title} – ocena ${o.rating} (${o.reviews} opinii)`,
      )
      .join('\n');
  }
}
