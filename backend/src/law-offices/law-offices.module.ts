import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LawOfficesController } from './law-offices.controller';
import { LawOfficesService } from './law-offices.service';

@Module({
  imports: [HttpModule],
  controllers: [LawOfficesController],
  providers: [LawOfficesService],
})
export class LawOfficesModule {}
