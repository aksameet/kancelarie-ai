import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { LawOfficesModule } from './law-offices/law-offices.module';

@Module({
  imports: [
    HttpModule, // to call SerpAPI
    ScheduleModule.forRoot(), // for daily cron, later
    LawOfficesModule,
  ],
})
export class AppModule {}
