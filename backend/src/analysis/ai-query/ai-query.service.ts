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
    // 1) wygeneruj pseudo‐query
    const pseudo = await this.gen.toOrmQuery(question);

    // 2) wykonaj
    const data = await this.exec.execute(pseudo);

    // 3) sformatuj odpowiedź – teraz data może być:
    //    - array of LawOffice
    //    - number (dla count)
    //    - { items, count } dla findAndCount
    const answer = await this.write.fromResult(question, data);

    return { answer };
  }
}
