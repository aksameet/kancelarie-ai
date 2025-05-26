import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LawOffice } from '../models/law-office.model';

@Injectable({
  providedIn: 'root',
})
export class LawOfficeService {
  constructor(private http: HttpClient) {}

  /** Pobiera listę kancelarii dla danego miasta */
  getOffices(city: string): Observable<LawOffice[]> {
    return this.http.get<LawOffice[]>(`/api/cities/${city}/law-offices`);
  }
}
