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
  private readonly model =
    process.env.GROQ_MODEL ?? 'deepseek-r1-distill-llama-70b';

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
  ) {}

  /**
   * Pobiera kancelarie z bazy, przycina do `limit` rekordów
   * i zwraca podsumowanie AI.
   */
  async summarize(
    city = 'warszawa',
    type = 'adwokacka',
    limit = 100,
  ): Promise<{ summary: string }> {
    if (!this.apiKey) {
      throw new HttpException('GROQ_API_KEY missing', HttpStatus.BAD_REQUEST);
    }

    const offices: LawOffice[] = await this.persist.find(city, type, limit);

    if (!offices.length) {
      throw new HttpException('Brak danych w bazie', HttpStatus.NOT_FOUND);
    }

    const prompt = this.buildPrompt(offices);

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'Najpierw napisz zdanie o rekrodach które otrzymałeś - ile, lokalizacja, o czym. Następnie stwórz zwięzłe (dokładnie 2 zdania) podsumowanie opinii klientów o kancelariach. Pisz po polsku. Max 300 znaków.',
        },
        { role: 'user', content: prompt },
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

    const summary =
      data.choices?.[0]?.message?.content?.trim() ?? 'Brak odpowiedzi AI';

    return { summary };
  }

  /* ---------------------- helpers ---------------------- */

  /** Buduje zwięzły prompt z ograniczoną liczbą rekordów. */
  private buildPrompt(offices: LawOffice[]): string {
    return offices
      .map(
        (o, idx) =>
          `[${idx + 1}] ${o.title} – ocena ${o.rating} (${o.reviews} opinii)`,
      )
      .join('\n');
  }
}
