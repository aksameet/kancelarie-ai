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

    if (pseudo.startsWith('PSEUDO-code:')) {
      pseudo = pseudo.replace(/^PSEUDO-code:\s*/, '');
    }

    const allowedPrefixes = [
      'find(',
      'findOne(',
      'findBy(',
      'findOneBy(',
      'count(',
      'findAndCount(',
      'find({',
      'find({ order:',
      'find({ skip:',
      'find({ where:',
      'find({ take:',
      'find({ where:',
      'find({ select:',
      'query(',
    ];

    const allowedKeywords = ['groupBy', 'distinct'];

    const isAllowed =
      allowedPrefixes.some((prefix) => pseudo.startsWith(prefix)) ||
      allowedKeywords.some((kw) => pseudo.includes(kw));

    if (!isAllowed) {
      throw new BadRequestException(
        `Unsupported query type. Only safe read-only queries like find(), count(), groupBy, distinct(), etc. are allowed.`,
      );
    }

    try {
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
      return await fn(this.repo, MoreThan, LessThan, Like, Not, IsNull, In);
    } catch (e) {
      throw new BadRequestException(
        `Nie udało się wykonać zapytania: ${e.message}`,
      );
    }
  }
}
