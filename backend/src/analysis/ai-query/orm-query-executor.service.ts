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
    // rozszerzona walidacja – dopuszczamy find, findOne, count i findAndCount
    if (!/^(find\(|findOne\(|count\(|findAndCount\()/.test(pseudo.trim())) {
      throw new BadRequestException(
        `Unsupported query type: only find(), findOne(), count(), findAndCount() allowed.`,
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
      // wykonujemy repo.<pseudo>
      `return repo.${pseudo};`,
    );

    let result;
    try {
      result = await fn(this.repo, MoreThan, LessThan, Like, Not, IsNull, In);
    } catch (e) {
      throw new BadRequestException(
        `Nie udało się wykonać zapytania: ${e.message}`,
      );
    }

    // jeśli to findAndCount → zwróć obiekt { items, count }
    if (pseudo.trim().startsWith('findAndCount(')) {
      const [items, count] = result as [LawOffice[], number];
      return { items, count };
    }

    return result;
  }
}
