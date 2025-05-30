import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiQueryService } from './ai-query.service';

@Controller('api/ai-query')
export class AiQueryController {
  constructor(private readonly aiQuery: AiQueryService) {}

  @Post()
  async run(
    @Body('question') question: string,
    @Body('conversationId') convId?: string,
  ) {
    if (!question || question.trim().length < 2) {
      throw new BadRequestException('Pytanie jest za krótkie');
    }
    return this.aiQuery.run(question.trim(), convId);
  }
}
