import { Controller, Get, Param } from '@nestjs/common';
import { LawOfficesService, LawOffice } from './law-offices.service';

@Controller('api/cities')
export class LawOfficesController {
  constructor(private readonly svc: LawOfficesService) {}

  @Get(':city/law-offices')
  async list(@Param('city') city: string): Promise<LawOffice[]> {
    return this.svc.getOffices(city);
  }
}
