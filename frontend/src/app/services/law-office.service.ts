import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LawOffice } from '../models/law-office.model';

@Injectable({
  providedIn: 'root',
})
export class LawOfficeService {
  constructor(private http: HttpClient) {}
  private readonly api = 'http://localhost:3000'; // <- Nest

  getOffices(city: string, type: string, limit: number) {
    return this.http.get<LawOffice[]>(
      `${this.api}/api/cities/${city}/law-offices`,
      { params: { type, limit } }
    );
  }
}
