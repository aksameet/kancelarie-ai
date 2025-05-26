import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { LawOffice } from '../models/law-office.model';
import { LawOfficeService } from '../services/law-office.service';

@Component({
  selector: 'app-law-offices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './law-offices.component.html',
  styleUrls: ['./law-offices.component.scss'],
})
export class LawOfficesComponent implements OnInit, OnChanges {
  @Input() city = 'poznan';

  offices: LawOffice[] = [];
  loading = false;
  error = '';

  constructor(private service: LawOfficeService) {}

  ngOnInit(): void {
    this.fetchOffices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['city'] && !changes['city'].firstChange) {
      this.fetchOffices();
    }
  }

  private fetchOffices(): void {
    this.offices = [];
    if (!this.city) {
      return;
    }
    this.loading = true;
    this.error = '';

    this.service
      .getOffices(this.city)
      .pipe(
        catchError((err) => {
          this.error =
            err.status === 0
              ? 'Nie można połączyć z backendem.'
              : `Błąd ${err.status}: ${err.statusText}`;
          return of([] as LawOffice[]);
        })
      )
      .subscribe((data) => {
        this.offices = data;
        this.loading = false;
        console.log('Data =>', data);
      });
  }
}
