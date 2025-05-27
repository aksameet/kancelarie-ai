import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { LawOfficesModule } from '../law-offices/law-offices.module';

@Module({
  imports: [
    HttpModule, // do wywołań HTTP (Groq API)
    LawOfficesModule, // daje dostęp do LawOfficePersistService
  ],
  providers: [AnalysisService],
  controllers: [AnalysisController],
})
export class AnalysisModule {}
