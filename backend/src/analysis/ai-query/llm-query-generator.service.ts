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
You are a system that converts natural‐language questions into valid TypeORM calls on the LawOffice repository.

Available methods: 
- repo.find({ where: { /* conditions */ }, order: { field: 'ASC'|'DESC' }, take: N })
- repo.count({ where: { /* conditions */ } })
- repo.findOne({ where: { /* conditions */ } })

Fields: id, city, specialization, rating, reviews, address, phone, types, open_state.

User question: "${userQ}"

Return ONLY the method call body (e.g. "find({ where: { city: 'Warszawa', rating: MoreThan(4.5) }, take: 3 })"). Do not wrap in backticks.
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
