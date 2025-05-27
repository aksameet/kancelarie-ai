// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  thoughts?: string; // opcjonalne, myśli AI
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = 'http://localhost:3000/api/analysis/chat';

  constructor(private http: HttpClient) {}

  ask(city: string, type: string, question: string, limit = 100) {
    return this.http.post<{ answer: string }>(this.api, {
      city,
      type,
      question,
      limit,
    });
  }
}
