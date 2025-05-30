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
    pseudo = pseudo.replace(/^repo\./, '').trim();

    if (
      !/^(find\(|findOne\(|findOneBy\(|count\(|findAndCount\()/.test(pseudo)
    ) {
      throw new BadRequestException(
        `Unsupported query type: only find(), findOne(), findOneBy(), count(), findAndCount() allowed.`,
      );
    }

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
      return await fn(this.repo, MoreThan, LessThan, Like, Not, IsNull, In);
    } catch (e) {
      throw new BadRequestException(
        `Nie udało się wykonać zapytania: ${e.message}`,
      );
    }
  }
}
