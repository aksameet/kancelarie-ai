import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class LlmQueryGeneratorService {
  constructor(private readonly http: HttpService) {}

  async toOrmQuery(userQ: string): Promise<string | null> {
    const prompt = `
You are an assistant converting user questions into TypeORM repository calls (not real code).

🎯 Your task:
- If the question relates to the database, return ONLY one of these calls: 
  → find({...}), findOne({...}), count({...}), findAndCount({...})
- NO variables, no async/await, no TypeScript/JS syntax
- Do NOT use findOneBy, findBy, or any other method
- If the question does NOT relate to querying the LawOffice database, reply exactly with: NONE

Fields available: id, city, specialization, rating, reviews, address, phone, types, open_state

User question: "${userQ}"

Only respond with:
→ a valid repository call like: count({})
→ or the word: NONE
`;

    const response = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_QUERY_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 100,
          temperature: 0,
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        },
      ),
    );

    const result = response.data.choices[0].message.content.trim();

    if (
      result === 'NONE' ||
      !/^(find\(|findOne\(|count\(|findAndCount\()/.test(result)
    ) {
      return null;
    }

    return result;
  }
}
