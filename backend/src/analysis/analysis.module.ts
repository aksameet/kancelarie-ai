// src/analysis/analysis.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { LawOfficesModule } from '../law-offices/law-offices.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

import { ChatSessionService } from './analysis.service'; // ← eksportuj ChatSessionService stąd

@Module({
  imports: [HttpModule, LawOfficesModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,

    ChatSessionService, // ← tutaj
  ],
})
export class AnalysisModule {}
