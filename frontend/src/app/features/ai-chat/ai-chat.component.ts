// src/app/features/ai-chat/ai-chat.component.ts
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

  constructor(private chat: ChatService) {}

  send() {
    const q = this.draft.trim();
    if (!q) return;

    /* 1️⃣ pokaż pytanie */
    this.messages.push({ role: 'user', content: q });
    this.draft = '';

    /* 2️⃣ placeholder „AI pisze…” */
    const placeholder: ChatMessage = {
      role: 'ai',
      content: '__loading__',
      thoughts: '',
    };
    this.messages.push(placeholder);
    this.loading = true;

    /* 3️⃣ wywołanie backendu */
    this.chat
      .ask(this.city, this.officeType, q, this.limit)
      .subscribe({
        next: ({ answer }) => {
          /* obetnij blok <think> … </think> */
          const regex = /<think>([\s\S]*?)<\/think>/i;
          const thoughtsMatch = answer.match(regex);
          placeholder.thoughts = thoughtsMatch?.[1].trim(); // opcjonalnie
          placeholder.content = answer.replace(regex, '').trim();
        },
        error: () => {
          placeholder.content = '❌ Błąd przy rozmowie z AI';
        },
      })
      .add(() => (this.loading = false));
  }
}
