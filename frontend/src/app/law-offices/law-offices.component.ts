// src/app/law-offices/law-offices.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

import { LawOfficeService } from '../services/law-office.service';
import { LawOffice } from '../models/law-office.model';

@Component({
  selector: 'app-law-offices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './law-offices.component.html',
})
export class LawOfficesComponent {
  /* ───────── PRIVATE BACKING FIELDS ───────── */
  private _city = 'poznan';
  private _type = 'adwokacka';
  private _limit = 20;

  public Math = Math;

  /* ───────── INPUTS with SETTERS ───────── */
  @Input()
  set city(val: string) {
    if (val !== this._city) {
      this._city = val;
      this.fetch();
    }
  }
  get city() {
    return this._city;
  }

  @Input()
  set officeType(val: string) {
    if (val !== this._type) {
      this._type = val;
      this.fetch();
    }
  }
  get officeType() {
    return this._type;
  }

  @Input()
  set resultLimit(val: number | string) {
    const num = +val || 20;
    if (num !== this._limit) {
      this._limit = num;
      this.fetch();
    }
  }
  get resultLimit() {
    return this._limit;
  }

  /* ───────── VIEW MODEL ───────── */
  offices: LawOffice[] = [];
  loading = false;
  error = '';

  constructor(private svc: LawOfficeService) {
    this.fetch(); // pierwszy raz
  }

  /* ───────── CORE ───────── */
  private fetch() {
    this.loading = true;
    this.error = '';

    this.svc
      .getOffices(this._city, this._type, this._limit)
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
