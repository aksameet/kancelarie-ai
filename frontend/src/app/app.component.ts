// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

/* pod-komponenty */
import { LawOfficesComponent } from './law-offices/law-offices.component';
import { LawOfficesChartsComponent } from './analytics/law-offices-charts.component';
import { AiChatComponent } from './features/ai-chat/ai-chat.component';
import { AiQueryComponent } from './features/ai-query/ai-query.component';

interface AiResponse {
  summary: string;
}

type Tab = 'summary' | 'charts' | 'chat' | 'query' | 'list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LawOfficesComponent,
    LawOfficesChartsComponent,
    AiChatComponent,
    AiQueryComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly apiBase = 'http://localhost:3000';

  /* --- selektory --- */
  cities = ['warszawa', 'poznan', 'krakow', 'wroclaw', 'gdansk'];
  officeTypes = [
    { value: 'adwokacka', label: 'Adwokacka' },
    { value: 'radcowska', label: 'Radcowska' },
    { value: 'notarialna', label: 'Notarialna' },
    { value: 'komornicza', label: 'Komornicza' },
    { value: 'podatkowa', label: 'Podatkowa' },
  ];
  limits = [20, 60, 100];

  selectedCity = this.cities[0];
  selectedType = this.officeTypes[0].value;
  selectedLimit = this.limits[0];

  /* --- dane --- */
  aiSummary = '';
  offices: any[] = []; // <- przekazywane do listy i wykresów
  loadingSummary = false;
  aiThoughts = '';

  /* --- UI --- */
  tabs: Tab[] = ['summary', 'charts', 'chat', 'query', 'list'];
  activeTab: Tab = 'summary';

  tabLabel(tab: (typeof this.tabs)[number]): string {
    switch (tab) {
      case 'summary':
        return 'Podsumowanie';
      case 'charts':
        return 'Wykresy';
      case 'chat':
        return 'Chat AI';
      case 'query':
        return 'Query AI';
      case 'list':
        return 'Lista';
      default:
        return tab;
    }
  }

  get buttonLabel(): string {
    if (this.loadingSummary) {
      return 'Analizuję…';
    }
    return this.offices.length ? 'Odśwież dane' : 'Załaduj dane';
  }

  constructor(private http: HttpClient) {}

  /* pobranie podsumowania + listy kancelarii */
  analyze(): void {
    this.loadingSummary = true;

    const params = {
      city: this.selectedCity,
      type: this.selectedType,
      limit: this.selectedLimit,
    };

    /* 1) podsumowanie */
    this.http
      .get<AiResponse>(`${this.apiBase}/api/analysis`, { params })
      .subscribe({
        next: ({ summary }) => {
          const reg = /<think>([\s\S]*?)<\/think>/i;
          const match = summary.match(reg);
          this.aiThoughts = match ? match[1].trim() : '';
          this.aiSummary = summary.replace(reg, '').trim();
        },
        error: () => {
          this.aiSummary = 'Błąd podczas analizy AI';
          this.aiThoughts = '';
        },
      })
      .add(() => (this.loadingSummary = false));

    /* 2) lista kancelarii do listy + wykresów */
    this.http
      .get<any[]>(
        `${this.apiBase}/api/cities/${this.selectedCity}/law-offices`,
        {
          params: { type: this.selectedType, limit: this.selectedLimit },
        }
      )
      .subscribe({
        next: (data) => (this.offices = data),
        error: () => (this.offices = []),
      });
  }
}
