// src/chat/chat-session.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

/* przechowujemy maks. 50 wiadomości / sesję */
const MAX_HISTORY = 50;

@Injectable()
export class ChatSessionService {
  private store = new Map<string, any[]>(); // conversationId → messages[]

  create(messages: any[]): string {
    const id = uuid();
    this.store.set(id, messages.slice(-MAX_HISTORY));
    return id;
  }

  get(id: string): any[] {
    return this.store.get(id) ?? [];
  }

  push(id: string, msg: any) {
    const arr = this.store.get(id);
    if (!arr) return;
    arr.push(msg);
    if (arr.length > MAX_HISTORY) arr.shift();
  }
}
