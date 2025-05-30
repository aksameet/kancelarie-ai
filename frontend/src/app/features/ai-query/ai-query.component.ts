import {
  Component,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';

interface Msg {
  role: 'user' | 'ai';
  content: string;
}

@Component({
  selector: 'ai-query',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MarkdownModule],
  templateUrl: './ai-query.component.html',
  styles: [
    ':host { display:flex; flex-direction:column; height:32rem; border:1px solid #ccc; border-radius:8px; padding:1rem }',
  ],
})
export class AiQueryComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  messages: Msg[] = [];
  draft = '';
  loading = false;
  cooldown = 0;
  private cooldownSub?: Subscription;

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    this.chatContainer.nativeElement.scrollTop =
      this.chatContainer.nativeElement.scrollHeight;
  }
  ngOnDestroy() {
    this.cooldownSub?.unsubscribe();
  }

  send() {
    if (!this.draft.trim() || this.loading || this.cooldown > 0) return;
    this.messages.push({ role: 'user', content: this.draft.trim() });
    this.messages.push({ role: 'ai', content: '__loading__' });
    const q = this.draft.trim();
    this.draft = '';
    this.loading = true;

    this.http
      .post<{ answer: string }>('http://localhost:3000/api/ai-query', {
        question: q,
      })
      .subscribe({
        next: ({ answer }) => {
          this.messages[this.messages.length - 1].content = answer;
        },
        error: (err) => {
          this.messages[this.messages.length - 1].content = `❌ ${
            err.error?.message || err.message
          }`;
          const ra = err.error?.retryAfter;
          if (ra > 0) {
            this.cooldown = ra;
            this.cooldownSub = interval(1000).subscribe(() => {
              if (--this.cooldown <= 0) this.cooldownSub?.unsubscribe();
            });
          }
        },
        complete: () => (this.loading = false),
      });
  }
}
