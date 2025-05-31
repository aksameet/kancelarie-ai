// src/ai-query/orm-query-executor.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import {
  Repository,
  MoreThan,
  LessThan,
  Like,
  Not,
  IsNull,
  In,
  Raw,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LawOffice } from 'src/law-offices/law-office.entity';

@Injectable()
export class OrmQueryExecutorService {
  private queryHistory: string[] = []; // 🧠 cache of past ORM queries

  constructor(
    @InjectRepository(LawOffice)
    private readonly repo: Repository<LawOffice>,
  ) {}

  getQueryHistory(): string[] {
    return this.queryHistory;
  }

  async execute(pseudo: string): Promise<any> {
    pseudo = pseudo.trim();

    const extracted = extractTypeOrmCall(pseudo);

    if (!extracted) {
      return {
        status: 'CLARIFY',
        message:
          'Nie udało się znaleźć zapytania TypeORM. Proszę sformułować pytanie inaczej lub podać konkretne kryteria.',
      };
    }

    console.log(`Extracted pseudo-query: ${extracted}`);
    pseudo = extracted;

    // Auto-fix Raw(...) assignment issue if present
    pseudo = pseudo.replace(
      /Raw\(\(alias\) => '([a-zA-Z_][\w]*)'\s*=\s*ANY\('\s*\+\s*alias\s*\+\s*'\)\)/g,
      (_, value) => `Raw((alias) => "'${value}' = ANY(" + alias + ")")`,
    );

    // Walidacja typu zapytania
    const allowedPrefixes = ['find(', 'count(', 'findAndCount(', 'query('];
    const allowedKeywords = ['groupBy', 'distinct'];
    const isAllowed =
      allowedPrefixes.some((prefix) => pseudo.startsWith(prefix)) ||
      allowedKeywords.some((kw) => pseudo.includes(kw));

    if (!isAllowed) {
      console.log('Unsupported query type:', pseudo);
      throw new BadRequestException(
        `Unsupported query type. Only safe read-only queries like find(), count(), groupBy, distinct(), etc. are allowed.`,
      );
    }

    // Parsowanie zapytania do walidacji semantycznej
    const riskyQueryMatch = pseudo.match(
      /(find|findAndCount)\s*\(\s*(\{[\s\S]*\})\s*\)/s,
    );
    if (riskyQueryMatch) {
      try {
        const fn = new Function(
          'MoreThan',
          'LessThan',
          'Like',
          'Not',
          'IsNull',
          'In',
          'Raw',
          `return (${riskyQueryMatch[2]});`,
        );
        const parsed = fn(MoreThan, LessThan, Like, Not, IsNull, In, Raw);
        const where = parsed.where ?? null;
        const take = parsed.take ?? null;

        const hasValidFilter =
          where &&
          typeof where === 'object' &&
          (Object.keys(where).some((key) =>
            [
              'city',
              'specialization',
              'type_id',
              'type_ids',
              'title',
              'rating',
              'reviews',
            ].includes(key),
          ) ||
            take === 1);

        if (!hasValidFilter) {
          return {
            status: 'TOO_BROAD',
            message:
              'Zapytanie jest zbyt ogólne i może zwrócić całą bazę danych. Proszę doprecyzować pytanie, np. podając miasto lub typ kancelarii.',
          };
        }
      } catch (err) {
        console.warn('Could not safely parse pseudo-query:', err);
        console.log(`Invalid pseudo-query: ${pseudo}`);
        return {
          status: 'INVALID',
          message:
            'Nie udało się przetworzyć zapytania. Proszę podać więcej konkretów.',
        };
      }
    }

    try {
      console.log('Execute:', pseudo);
      const fn = new Function(
        'repo',
        'MoreThan',
        'LessThan',
        'Like',
        'Not',
        'IsNull',
        'In',
        'Raw',
        `return repo.${pseudo};`,
      );
      this.queryHistory.push(pseudo);

      return await fn(
        this.repo,
        MoreThan,
        LessThan,
        Like,
        Not,
        IsNull,
        In,
        Raw,
      );
    } catch (e) {
      console.log(`ERROR executing ORM query: ${e.message}`);
      console.log(`Pseudo-query: ${pseudo}`);
      throw new BadRequestException(
        `Nie udało się wykonać zapytania: ${e.message}`,
      );
    }
  }
}

function extractTypeOrmCall(raw: string): string | null {
  console.log(`Extracting TypeORM call from: ${raw}`);
  let input = raw
    .replace(/<think>([\s\S]*?)<\/think>/gi, '')
    .replace(/PSEUDO-code:\s*:?/i, '')
    .trim()
    .replace(/^repo\./, '')
    .trim();

  const match = input.match(/\b(find|findAndCount|count|query)\s*\(/);
  if (!match) return null;

  const start = match.index!;
  const prefix = match[1];
  let i = start + prefix.length;
  let openParens = 0;
  let foundOpen = false;

  while (i < input.length) {
    const char = input[i];
    if (char === '(') {
      openParens++;
      foundOpen = true;
    } else if (char === ')') {
      openParens--;
      if (foundOpen && openParens === 0) {
        return input.slice(start, i + 1).trim();
      }
    }
    i++;
  }

  return null;
}
