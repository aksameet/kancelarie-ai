import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

import { LawOfficeService } from '../services/law-office.service';
import { LawOffice } from '../models/law-office.model';
import { LawOfficesChartsComponent } from '../analytics/law-offices-charts.component';

@Component({
  selector: 'app-law-offices',
  standalone: true,
  imports: [CommonModule, LawOfficesChartsComponent],
  templateUrl: './law-offices.component.html',
})
export class LawOfficesComponent implements OnChanges {
  /** Inputs from parent */
  @Input() city!: string;
  @Input() officeType!: string;
  @Input() resultLimit!: number;

  /** View model */
  offices: LawOffice[] = [];
  loading = false;
  error = '';

  showCharts = false;
  public Math = Math;

  constructor(private svc: LawOfficeService) {}

  /** Lifecycle hook: fetch when any input changes */
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['city']?.currentValue ||
      changes['officeType']?.currentValue ||
      changes['resultLimit']?.currentValue
    ) {
      this.fetch();
    }
  }

  /** Core fetch logic */
  private fetch(): void {
    if (!this.city || !this.officeType || !this.resultLimit) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.svc
      .getOffices(this.city, this.officeType, this.resultLimit)
      .pipe(
        catchError((err) => {
          this.error = err.message ?? 'Błąd pobierania';
          return of([] as LawOffice[]);
        })
      )
      .subscribe((list) => {
        this.offices = list;
        this.loading = false;
      });
  }
}
