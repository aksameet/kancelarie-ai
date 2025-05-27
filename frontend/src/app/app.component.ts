// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LawOfficesComponent } from './law-offices/law-offices.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LawOfficesComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  cities = ['poznan', 'warszawa', 'krakow', 'wroclaw', 'gdansk'];
  officeTypes = [
    { value: 'adwokacka', label: 'Adwokacka' },
    { value: 'radcowska', label: 'Radcowska' },
    { value: 'notarialna', label: 'Notarialna' },
    { value: 'komornicza', label: 'Komornicza' },
    { value: 'podatkowa', label: 'Podatkowa' },
  ];
  selectedCity = this.cities[0];
  selectedType = this.officeTypes[0].value;
  limits = [20, 60, 100];
  selectedLimit = 20;
  aiSummary = '';

  constructor(private http: HttpClient) {}

  analyze() {
    /* city, type pobierz wg Twojej logiki / selectów */
    const city = this.selectedCity || 'warszawa';
    const type = this.selectedType || 'adwokacka';

    this.http
      .get<{ result: string }>(`/api/analysis?city=${city}&type=${type}`)
      .subscribe({
        next: (res: any) => (this.aiSummary = res),
        error: () => (this.aiSummary = 'Błąd podczas analizy AI'),
      });
  }
}
