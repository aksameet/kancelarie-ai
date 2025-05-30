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
    // 1) LLM generuje pseudokod TypeORM
    const pseudo = await this.gen.toOrmQuery(question);

    // 2) Wykonaj w bazie (bezpiecznie)
    const data = await this.exec.execute(pseudo);

    // 3) LLM generuje końcową odpowiedź na podstawie danych
    const answer = await this.write.fromResult(question, data);

    return { answer };
  }
}
