import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

import { LawOfficesModule } from './law-offices/law-offices.module';
import { LawOffice } from './law-offices/law-office.entity';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [LawOffice],
      synchronize: true, // DEV only – w prod migracje!
      ssl: { rejectUnauthorized: false },
    }),

    HttpModule,
    ScheduleModule.forRoot(),
    LawOfficesModule,
    AnalysisModule,
  ],
})
export class AppModule {}
