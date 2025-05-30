import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AiQueryResponse {
  answer: string;
  conversationId: string;
  needsClarification?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiQueryService {
  private readonly apiUrl = 'http://localhost:3000/api/ai-query';
  private conversationId: string | null = null;

  constructor(private readonly http: HttpClient) {
    // spróbuj wczytać z localStorage
    this.conversationId = localStorage.getItem('convId');
  }

  ask(question: string): Observable<AiQueryResponse> {
    const payload: any = { question };
    if (this.conversationId) {
      payload.conversationId = this.conversationId;
    }
    return this.http.post<AiQueryResponse>(this.apiUrl, payload).pipe(
      tap((res) => {
        if (res.conversationId && res.conversationId !== this.conversationId) {
          this.conversationId = res.conversationId;
          localStorage.setItem('convId', res.conversationId);
        }
      })
    );
  }
}
