// src/law-offices/law-offices.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { LawOfficesService } from './law-offices.service';

@Controller('api/cities')
export class LawOfficesController {
  constructor(private readonly svc: LawOfficesService) {}

  @Get(':city/law-offices')
  list(
    @Param('city') city: string,
    @Query('type') type = 'adwokacka',
    @Query('limit') limit = '20',
  ) {
    const num = parseInt(limit, 10) || 20;
    return this.svc.getOffices(city, type, num);
  }
}
