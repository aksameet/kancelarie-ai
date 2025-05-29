import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AnalysisSummarizeService } from './analysis-summarize.service';

@Controller('api/analysis')
export class AnalysisSummarizeController {
  constructor(private readonly service: AnalysisSummarizeService) {}

  @Get()
  summarize(
    @Query('city') city = 'warszawa',
    @Query('type') type = 'adwokacka',
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
  ) {
    return this.service.summarize(city, type, limit);
  }
}
