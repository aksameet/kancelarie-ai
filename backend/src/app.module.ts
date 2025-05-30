import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

import { LawOfficesModule } from './law-offices/law-offices.module';
import { LawOffice } from './law-offices/law-office.entity';
import { AnalysisSummarizeModule } from './analysis/analysis-summarize/analysis-summarize.module';
import { ChatModule } from './analysis/analysis-chat/chat.module';
import { AiQueryModule } from './analysis/ai-query/ai-query.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [LawOffice],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),

    HttpModule,
    ScheduleModule.forRoot(),
    LawOfficesModule,
    AnalysisSummarizeModule,
    ChatModule,

    AiQueryModule,
  ],
})
export class AppModule {}
