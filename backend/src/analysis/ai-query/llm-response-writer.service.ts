import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LlmResponseWriterService {
  constructor(private readonly http: HttpService) {}

  /**
   * Tworzy odpowiedź bazując na wyniku zapytania do bazy.
   * @param userQ - pytanie użytkownika
   * @param data - wynik zapytania do bazy
   * @param history - opcjonalna historia konwersacji do kontekstu
   */
  async fromResult(
    userQ: string,
    data: any,
    history?: string,
  ): Promise<string> {
    const context = history
      ? `Historia:
${history}

`
      : '';
    const prompt = `
${context}User asked: "${userQ}".
Here's the query result: ${JSON.stringify(data)}

Summarize concisely and clearly in Polish:
`;

    const response = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_RESPONSE_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 500,
          temperature: 0.1,
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        },
      ),
    );

    return response.data.choices[0].message.content.trim();
  }

  /**
   * Odpowiada na pytanie ogólne, nie związane z bazą.
   * @param userQ - pytanie użytkownika
   * @param history - opcjonalna historia konwersacji do kontekstu
   */
  async generalAnswer(userQ: string, history?: string): Promise<string> {
    const context = history
      ? `Historia:
${history}

`
      : '';
    const prompt = `${context}Odpowiedz zwięźle na pytanie użytkownika po polsku: "${userQ}"`;

    const { data: res } = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_RESPONSE_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 100,
          temperature: 0.5,
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } },
      ),
    );
    return res.choices[0].message.content.trim();
  }
}
