import { Injectable, BadRequestException } from '@nestjs/common';
import { LlmQueryGeneratorService } from './llm-query-generator.service';
import { LlmResponseWriterService } from './llm-response-writer.service';
import { OrmQueryExecutorService } from './orm-query-executor.service';
import { ConversationService } from './conversation.service';
import { v4 as uuid } from 'uuid';

export interface AiQueryResult {
  answer: string;
  conversationId: string;
  needsClarification?: boolean;
}

@Injectable()
export class AiQueryService {
  constructor(
    private readonly gen: LlmQueryGeneratorService,
    private readonly exec: OrmQueryExecutorService,
    private readonly write: LlmResponseWriterService,
    private readonly conv: ConversationService,
  ) {}

  async run(question: string, convId?: string): Promise<AiQueryResult> {
    const cid = convId || uuid();
    const history = this.conv
      .getHistory(cid)
      .map((h) => `${h.question} -> ${h.answer}`)
      .join('\n');

    // 1) Spróbuj wygenerować ORMy
    const pseudo = await this.gen.toOrmQuery(question, history);

    if (pseudo === 'CLARIFY') {
      const msg = 'Proszę doprecyzuj pytanie';
      this.conv.append(cid, question, msg);
      return { answer: msg, conversationId: cid, needsClarification: true };
    }

    if (pseudo === 'NONE') {
      const answer = await this.write.generalAnswer(question, history);
      this.conv.append(cid, question, answer);
      return { answer, conversationId: cid };
    }

    // 2) Jeśli nie ma mapowania do bazy, ogólna odpowiedź
    if (!pseudo) {
      console.log(`No ORM mapping for question: "${question}"`);
      const answer = await this.write.generalAnswer(question, history);
      this.conv.append(cid, question, answer);
      return { answer, conversationId: cid };
    }

    // 3) Wykonaj zapytanie do bazy, ale w razie błędu traktuj jako ogólne
    try {
      console.log(`Executing ORM query: ${pseudo}`);
      const data = await this.exec.execute(pseudo);
      const answer = await this.write.fromResult(question, data, history);
      this.conv.append(cid, question, answer);
      return { answer, conversationId: cid };
    } catch (err) {
      // Jeśli zapytanie ORM nie przeszło, odpytujemy LLM o normalną odpowiedź
      const fallback = await this.write.generalAnswer(question, history);
      this.conv.append(cid, question, fallback);
      return { answer: fallback, conversationId: cid };
    }
  }
}
