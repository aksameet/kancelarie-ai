// src/app/services/ai-query.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiQueryResponse {
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class AiQueryService {
  private readonly apiUrl = 'http://localhost:3000/api/ai-query';

  constructor(private readonly http: HttpClient) {}

  /**
   * Wysyła do backendu pytanie i zwraca Observable
   */
  ask(question: string): Observable<AiQueryResponse> {
    return this.http.post<AiQueryResponse>(this.apiUrl, { question });
  }
}
