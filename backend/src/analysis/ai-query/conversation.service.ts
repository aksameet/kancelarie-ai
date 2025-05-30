import { Injectable } from '@nestjs/common';

interface Conversation {
  id: string;
  history: { question: string; answer: string }[];
}

@Injectable()
export class ConversationService {
  private conversations = new Map<string, Conversation>();

  ensure(id: string) {
    if (!this.conversations.has(id)) {
      this.conversations.set(id, { id, history: [] });
    }
    return this.conversations.get(id)!;
  }

  append(id: string, question: string, answer: string) {
    const conv = this.ensure(id);
    conv.history.push({ question, answer });
  }

  getHistory(id: string) {
    return this.ensure(id).history;
  }
}
