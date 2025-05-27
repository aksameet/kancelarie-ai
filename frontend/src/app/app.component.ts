// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LawOfficesComponent } from './law-offices/law-offices.component';

interface AiResponse {
  summary: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LawOfficesComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  /* ---------- formularz ---------- */
  cities = ['poznan', 'warszawa', 'krakow', 'wroclaw', 'gdansk'];
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

  /* ---------- wyniki ---------- */
  aiSummary = '';
  aiThoughts = '';
  loading = false;

  constructor(private http: HttpClient) {}

  analyze(): void {
    this.loading = true;

    const params = {
      city: this.selectedCity,
      type: this.selectedType,
      limit: this.selectedLimit,
    };

    this.http
      .get<AiResponse>('/api/analysis', { params })
      .subscribe({
        next: ({ summary }) => {
          /* oddziel sekcję <think> … </think> od właściwego podsumowania */
          const thoughtMatch = summary.match(/<think>([\s\S]*?)<\/think>/i);
          this.aiThoughts = thoughtMatch ? thoughtMatch[1].trim() : '';
          this.aiSummary = summary
            .replace(/<think>[\s\S]*?<\/think>/i, '')
            .trim();
        },
        error: () => {
          this.aiSummary = 'Błąd podczas analizy AI';
          this.aiThoughts = '';
        },
      })
      .add(() => (this.loading = false));
  }
}
