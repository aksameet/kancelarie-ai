import { Controller, Get, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('api/analysis')
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @Get()
  summarize(
    @Query('city') city = 'warszawa',
    @Query('type') type = 'adwokacka',
  ) {
    return this.service.summarize(city, type);
  }
}
