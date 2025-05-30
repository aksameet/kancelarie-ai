import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LlmQueryGeneratorService } from './llm-query-generator.service';
import { LlmResponseWriterService } from './llm-response-writer.service';
import { OrmQueryExecutorService } from './orm-query-executor.service';

@Injectable()
export class AiQueryService {
  constructor(
    private readonly gen: LlmQueryGeneratorService,
    private readonly exec: OrmQueryExecutorService,
    private readonly write: LlmResponseWriterService,
  ) {}

  async run(question: string): Promise<{ answer: string }> {
    const pseudo = await this.gen.toOrmQuery(question);

    if (!pseudo) {
      console.log('🟡 Nie-database zapytanie – leci general answer');
      const answer = await this.write.generalAnswer(question);
      return { answer };
    }

    const data = await this.exec.execute(pseudo);
    const answer = await this.write.fromResult(question, data);
    return { answer };
  }
}
