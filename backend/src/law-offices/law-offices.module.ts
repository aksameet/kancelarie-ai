// src/law-offices/law-offices.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // ⬅️ 1)  dodaj
import { TypeOrmModule } from '@nestjs/typeorm';

import { LawOffice } from './law-office.entity';
import { LawOfficesService } from './law-offices.service';
import { LawOfficePersistService } from './law-office-persist.service';
import { LawOfficesController } from './law-offices.controller';

@Module({
  imports: [
    HttpModule, // ⬅️ 2)  wstrzyknij
    TypeOrmModule.forFeature([LawOffice]),
  ],
  providers: [LawOfficesService, LawOfficePersistService],
  controllers: [LawOfficesController],
  exports: [LawOfficesService], // opcjonalnie
})
export class LawOfficesModule {}
