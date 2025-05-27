// src/analysis/analysis.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { LawOfficePersistService } from '../law-offices/law-office-persist.service';
import { LawOffice } from '../law-offices/law-office.entity';

@Injectable()
export class AnalysisService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
  ) {}

  async summarize(city = 'warszawa', type = 'adwokacka'): Promise<string> {
    if (!this.apiKey)
      throw new HttpException('GROQ_API_KEY missing', HttpStatus.BAD_REQUEST);

    /* pobierz z bazy do 1000 rekordów */
    const offices: LawOffice[] = await this.persist.find(city, type, 1000);

    if (!offices.length)
      throw new HttpException(
        'Brak danych w bazie – odśwież scraper',
        HttpStatus.NOT_FOUND,
      );

    const fileContents = this.buildPrompt(offices);

    const body = {
      model: 'deepseek-r1-distill-llama-70b',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś analitykiem rynku usług prawnych. Stwórz zwięzłe (3-4 zdania) podsumowanie opinii klientów o kancelariach w danym mieście. Pisz po polsku.',
        },
        { role: 'user', content: fileContents },
      ],
      max_tokens: 400,
      temperature: 0.3,
    };

    const { data } = await firstValueFrom(
      this.http.post(this.endpoint, body, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    return data.choices?.[0]?.message?.content?.trim() ?? 'Brak odpowiedzi AI';
  }

  /* ---------------------- helpers ---------------------- */
  private buildPrompt(offices: LawOffice[]): string {
    return offices
      .map(
        (o) =>
          `[${o.position}] ${o.title} – ocena ${o.rating} (${o.reviews} opinii)`,
      )
      .join('\n');
  }
}
