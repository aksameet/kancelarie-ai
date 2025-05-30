import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LlmResponseWriterService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model = process.env.GROQ_MODEL!;

  constructor(private readonly http: HttpService) {}

  async fromResult(userQ: string, data: any): Promise<string> {
    const prompt = `
Masz wynik zapytania do bazy (JSON). Użytkownik pyta: "${userQ}".
Na podstawie wyników napisz zwięzłą odpowiedź po polsku.

Wynik:
${JSON.stringify(data)}

Odpowiedź:
`;
    const { data: res } = await firstValueFrom(
      this.http.post(
        this.endpoint,
        {
          model: this.model,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 500,
          temperature: 0,
        },
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      ),
    );
    return res.choices[0].message.content.trim();
  }
}
