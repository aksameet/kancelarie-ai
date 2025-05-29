import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styles: [':host { @apply flex flex-col h-[32rem] border rounded-lg p-4 }'],
})
export class AiChatComponent implements AfterViewChecked, OnDestroy {
  @Input() city = 'poznan';
  @Input() officeType = 'adwokacka';
  @Input() limit = 100;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: ChatMessage[] = [];
  draft = '';
  loading = false;
  conversationId?: string;

  /** cooldown w sekundach */
  cooldownSeconds = 0;
  private cooldownSub?: Subscription;

  constructor(private chat: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.clearCooldown();
  }

  send(): void {
    // zablokuj jeśli już w trakcie lub w cooldown
    if (this.loading || this.cooldownSeconds > 0) return;
    const q = this.draft.trim();
    if (!q) return;

    // dodajemy user i loader-placeholder
    this.messages.push({ role: 'user', content: q });
    this.draft = '';
    const placeholder: ChatMessage = { role: 'ai', content: '__loading__' };
    this.messages.push(placeholder);
    this.loading = true;

    this.chat
      .ask(this.city, this.officeType, q, this.limit, this.conversationId)
      .subscribe({
        next: ({ answer, conversationId }) => {
          this.conversationId = conversationId;
          const thinkRe = /<think>([\s\S]*?)<\/think>/i;
          const m = answer.match(thinkRe);
          placeholder.thoughts = m?.[1].trim();
          placeholder.content = answer.replace(thinkRe, '').trim() || '—';
        },
        error: (err) => {
          this.loading = false;
          // błąd + retryAfter
          const msg = err.error?.message ?? err.message ?? 'Błąd AI';
          placeholder.content = `❌ ${msg}`;
          const ra = err.error?.retryAfter;

          if (typeof ra === 'number' && ra > 0) {
            this.cooldownSeconds = ra;
            this.startCooldown();
          }
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private startCooldown() {
    this.cooldownSub = interval(1000).subscribe(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        this.clearCooldown();
      }
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
