// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LawOfficesComponent } from './law-offices/law-offices.component';

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
}
