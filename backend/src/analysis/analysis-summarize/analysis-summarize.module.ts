import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisSummarizeController } from './analysis-summarize.controller';
import { AnalysisSummarizeService } from './analysis-summarize.service';
import { LawOfficesModule } from 'src/law-offices/law-offices.module';

@Module({
  imports: [HttpModule, LawOfficesModule],
  controllers: [AnalysisSummarizeController],
  providers: [AnalysisSummarizeService],
})
export class AnalysisSummarizeModule {}
