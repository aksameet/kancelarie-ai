import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LawOfficePersistService } from 'src/law-offices/law-office-persist.service';
import { buildPrompt, PromptMode } from '../build-prompt';

@Injectable()
export class AnalysisSummarizeService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model = process.env.GROQ_MODEL;

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
  ) {}

  async summarize(
    city: string,
    type: string,
    limit: number,
  ): Promise<{ summary: string }> {
    const offices = await this.fetchOffices(city, type, limit);
    const prompt = buildPrompt(
      offices,
      offices.length > 2000
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
          name: 'language_instruction',
          content:
            'Use sophisticated, expert-level scientific Polish language with a rich vocabulary full of wisdom and eloquence.',
        },
        {
          role: 'system',
          content: `
          In the first sentence (use correct grammatical inflections): "Otrzymałem ${offices.length} (podaj poprawne odmiany) ${type} z ${city}".
          Then, present an expert-level summary of the database data, describing various nuances of the dataset, along with in-depth analyses and interpretations. Feel free to engage in overinterpretation.
        `,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 1.5,
    };

    const { data } = await firstValueFrom(
      this.http.post(this.endpoint, body, this.headers()),
    );

    const raw = data.choices?.[0]?.message?.content ?? '';
    return { summary: raw.replace(/\[END]$/i, '').trim() };
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
    if (!offices.length)
      throw new HttpException(
        'Brak danych – odśwież scraper',
        HttpStatus.NOT_FOUND,
      );
    return offices;
  }
}
