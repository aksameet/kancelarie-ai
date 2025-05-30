import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LlmQueryGeneratorService {
  constructor(private readonly http: HttpService) {}

  async toOrmQuery(userQ: string, history: string): Promise<string | null> {
    const prompt = `
Jesteś asystentem, który zamienia pytania użytkownika w wywołania TypeORM (pseudo-kod).
Jeżeli pytanie jest zbyt ogólne, odpowiedz dokładnie: CLARIFY
Jeśli pytanie nie dotyczy bazy LawOffice, odpowiedz: NONE
Dostępne pola: id, city, specialization, rating, reviews, address, phone, types, open_state.

Historia konwersacji:
${history}

Użytkownik pyta: "${userQ}"

Odpowiedz *tylko*:
- PSEUDO-wywołanie: find(...), findOne(...), count(...), findAndCount(...)
- lub: NONE
- lub: CLARIFY
    `.trim();

    const res = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_QUERY_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 50,
          temperature: 0,
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        },
      ),
    );
    const out = res.data.choices[0].message.content.trim();
    if (out === 'NONE') return null;
    if (out === 'CLARIFY') return 'CLARIFY';
    return out;
  }
}
