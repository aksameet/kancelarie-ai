/* ──────────────────────────────────────────────────────────────
   src/app/services/chat.service.ts
   ────────────────────────────────────────────────────────────── */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  thoughts?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = 'http://localhost:3000/api/analysis/chat';

  constructor(private http: HttpClient) {}

  ask(
    city: string,
    type: string,
    question: string,
    limit: number,
    conversationId?: string
  ) {
    return this.http.post<{
      answer: string;
      conversationId: string;
    }>(this.api, {
      city,
      type,
      question,
      limit,
      conversationId,
    });
  }
}
