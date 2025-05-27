// src/analysis/analysis.controller.ts
import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('api/analysis')
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  /**
   * Zwraca skrócone podsumowanie opinii o kancelariach.
   *
   * @param city  Miasto (domyślnie „warszawa”)
   * @param type  Typ kancelarii (domyślnie „adwokacka”)
   * @param limit Maksymalna liczba rekordów przekazanych do AI (domyślnie 100)
   */
  @Get()
  summarize(
    @Query('city') city = 'warszawa',
    @Query('type') type = 'adwokacka',
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
  ) {
    return this.service.summarize(city, type, limit);
  }
}
