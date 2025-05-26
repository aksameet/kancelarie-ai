import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LawOfficesComponent } from './law-offices/law-offices.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LawOfficesComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  cities = ['poznan', 'warszawa', 'krakow', 'wroclaw', 'gdansk'];
  selectedCity = this.cities[0];
}
