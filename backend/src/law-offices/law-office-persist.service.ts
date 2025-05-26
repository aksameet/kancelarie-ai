import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LawOffice } from './law-office.entity';

@Injectable()
export class LawOfficePersistService {
  constructor(
    @InjectRepository(LawOffice)
    private readonly repo: Repository<LawOffice>,
  ) {}

  /** ➜ zastępuje stare wpisy kompletem nowych dla (city, specialization) */
  async replace(city: string, specialization: string, data: LawOffice[]) {
    await this.repo.delete({ city, specialization });
    await this.repo.save(data.map((d) => ({ ...d, city, specialization })));
  }

  /** ➜ pobierz z bazy maks. `limit` wierszy dla miasta + specjalizacji */
  async find(
    city: string,
    specialization: string,
    limit = 20,
  ): Promise<LawOffice[]> {
    return this.repo.find({
      where: { city, specialization },
      order: { position: 'ASC' },
      take: limit,
    });
  }
}
