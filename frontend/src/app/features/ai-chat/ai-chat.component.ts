/* ──────────────────────────────────────────────────────────────
   src/app/features/ai-chat/ai-chat.component.ts
   ────────────────────────────────────────────────────────────── */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styles: [':host { @apply flex flex-col h-[32rem] border rounded-lg p-4 }'],
})
export class AiChatComponent {
  @Input() city = 'poznan';
  @Input() officeType = 'adwokacka';
  @Input() limit = 100;

  messages: ChatMessage[] = [];
  draft = '';
  loading = false;
  conversationId?: string;

  constructor(private chat: ChatService) {}

  send(): void {
    const q = this.draft.trim();
    if (!q) return;

    /* user message */
    this.messages.push({ role: 'user', content: q });
    this.draft = '';

    /* placeholder */
    const ph: ChatMessage = { role: 'ai', content: '__loading__' };
    this.messages.push(ph);
    this.loading = true;

    this.chat
      .ask(this.city, this.officeType, q, this.limit, this.conversationId)
      .subscribe({
        next: ({ answer, conversationId }) => {
          this.conversationId = conversationId;

          const reg = /<think>([\s\S]*?)<\/think>/i;
          const m = answer.match(reg);

          ph.thoughts = m?.[1].trim();
          ph.content = answer.replace(reg, '').trim() || '—';
        },
        error: () => {
          ph.content = '❌ Błąd przy rozmowie z AI';
        },
        complete: () => (this.loading = false),
      });
  }
}
