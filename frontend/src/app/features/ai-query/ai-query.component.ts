import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { MarkdownModule } from 'ngx-markdown';
import { AiQueryService } from '../../services/ai-query.service';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Component({
  selector: 'ai-query',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './ai-query.component.html',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 32rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem;
        background: white;
      }
    `,
  ],
})
export class AiQueryComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: ChatMessage[] = [];
  draft = '';
  loading = false;

  /** cooldown w sekundach */
  cooldownSeconds = 0;
  private cooldownSub?: Subscription;

  clarificationMode = false;

  constructor(private aiQuery: AiQueryService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.clearCooldown();
  }

  send(): void {
    if (this.loading || this.cooldownSeconds > 0) return;
    const q = this.draft.trim();
    if (!q) return;

    // 1) dodajemy pytanie i placeholder
    this.messages.push({ role: 'user', content: q });
    this.draft = '';
    const placeholder: ChatMessage = { role: 'ai', content: '__loading__' };
    this.messages.push(placeholder);
    this.loading = true;

    // 2) wywołanie endpointu z catchError & finalize
    this.aiQuery
      .ask(q)
      .pipe(
        catchError((err) => {
          const msg = err.error?.message ?? err.message ?? 'Błąd AI-Query';
          placeholder.content = `❌ ${msg}`;

          const ra = err.error?.retryAfter;
          if (typeof ra === 'number' && ra > 0) {
            this.cooldownSeconds = ra;
            this.startCooldown();
          }
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(({ answer, needsClarification }) => {
        placeholder.content = answer.trim() || '—';
        this.clarificationMode = !!needsClarification;
      });
  }

  private startCooldown() {
    this.cooldownSub = interval(1000).subscribe(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) this.clearCooldown();
    });
  }

  private clearCooldown() {
    this.cooldownSeconds = 0;
    this.cooldownSub?.unsubscribe();
    this.cooldownSub = undefined;
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
