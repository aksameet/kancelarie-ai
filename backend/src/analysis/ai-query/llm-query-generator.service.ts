import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LlmQueryGeneratorService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey = process.env.GROQ_API_KEY!;
  private readonly model = process.env.GROQ_MODEL!;

  constructor(private readonly http: HttpService) {}

  async toOrmQuery(userQ: string): Promise<string> {
    const prompt = `
You convert natural‐language questions into TypeORM repository calls on LawOffice.

**Allowed methods**:
  - repo.find({...})
  - repo.findOne({...})
  - repo.count({...})
  - repo.findAndCount({...})

**Fields**: id, city, specialization, rating, reviews, address, phone, types, open_state.

**Return only** the call body, e.g. "find({ where: { city: 'Warszawa' }, take: 3 })".

User question: "${userQ}"
Pseudo‐query:
`;

    const { data } = await firstValueFrom(
      this.http.post(
        this.endpoint,
        {
          model: this.model,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 200,
          temperature: 0,
        },
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      ),
    );

    return data.choices[0].message.content.trim();
  }
}
