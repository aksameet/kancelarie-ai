import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { LawOffice } from 'src/law-offices/law-office.entity';
import { AiQueryController } from './ai-query.controller';
import { AiQueryService } from './ai-query.service';
import { LlmQueryGeneratorService } from './llm-query-generator.service';
import { LlmResponseWriterService } from './llm-response-writer.service';
import { OrmQueryExecutorService } from './orm-query-executor.service';
import { ConversationService } from './conversation.service';

@Module({
  imports: [TypeOrmModule.forFeature([LawOffice]), HttpModule],
  controllers: [AiQueryController],
  providers: [
    AiQueryService,
    LlmQueryGeneratorService,
    OrmQueryExecutorService,
    LlmResponseWriterService,
    ConversationService,
  ],
})
export class AiQueryModule {}
