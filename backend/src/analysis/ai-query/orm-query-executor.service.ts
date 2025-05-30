// src/ai-query/orm-query-executor.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, MoreThan, LessThan, Like, Not, IsNull, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LawOffice } from 'src/law-offices/law-office.entity';

@Injectable()
export class OrmQueryExecutorService {
  constructor(
    @InjectRepository(LawOffice)
    private readonly repo: Repository<LawOffice>,
  ) {}

  async execute(pseudo: string): Promise<any> {
    // tylko find / findOne / count
    if (!/^(find|findOne|count)\(/.test(pseudo)) {
      throw new BadRequestException('Unsupported query type');
    }

    // wstrzykujemy teraz także IsNull, In itp.
    const fn = new Function(
      'repo',
      'MoreThan',
      'LessThan',
      'Like',
      'Not',
      'IsNull',
      'In',
      `return repo.${pseudo};`,
    );

    try {
      const result = await fn(
        this.repo,
        MoreThan,
        LessThan,
        Like,
        Not,
        IsNull,
        In,
      );
      return result;
    } catch (e) {
      throw new BadRequestException(
        `Nie udało się wykonać zapytania: ${e.message}`,
      );
    }
  }
}
