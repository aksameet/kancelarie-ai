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
    const context = history ? `History: ${history}.` : '';
    const prompt = `${context} User asked: "${userQ}". The following is the result of a database query related to that question: Result: ${JSON.stringify(data)}. Generate a short and clear answer in Polish based on this result.`;

    const response = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_RESPONSE_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 1000,
          temperature: 0.5,
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
    const context = history ? `Historia: ${history}` : '';
    const prompt = `${context}Respond concisely to the user's question in Polish: "${userQ}"`;

    const { data: res } = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_RESPONSE_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 100,
          temperature: 1.2,
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } },
      ),
    );
    return res.choices[0].message.content.trim();
  }
}
