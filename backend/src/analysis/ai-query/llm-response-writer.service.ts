import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class LlmResponseWriterService {
  constructor(private readonly http: HttpService) {}

  async fromResult(userQ: string, data: any): Promise<string> {
    const prompt = `
    User asked: "${userQ}".
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

  async generalAnswer(userQ: string): Promise<string> {
    const prompt = `Odpowiedz zwięźle na pytanie użytkownika po polsku: "${userQ}"`;

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
