// src/analysis/analysis.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('api/analysis')
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  /* skrócone podsumowanie (dotychczas) */
  @Get()
  summarize(
    @Query('city') city = 'warszawa',
    @Query('type') type = 'adwokacka',
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
  ) {
    return this.service.summarize(city, type, limit);
  }

  /*  chat z AI  */
  @Post('chat')
  chat(
    @Body('city') city = 'warszawa',
    @Body('type') type = 'adwokacka',
    @Body('question') question: string,
    @Body('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
  ) {
    return this.service.chat(city, type, limit, question);
  }
}
