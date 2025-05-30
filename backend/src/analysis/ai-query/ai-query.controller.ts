import { Controller, Post, Body } from '@nestjs/common';
import { AiQueryService } from './ai-query.service';

@Controller('api/ai-query')
export class AiQueryController {
  constructor(private readonly aiQuery: AiQueryService) {}

  @Post()
  async run(@Body('question') question: string) {
    return this.aiQuery.run(question);
  }
}
