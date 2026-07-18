import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';

export interface CessationRequest {
  motifCessation: string;
}

@Injectable({
  providedIn: 'root',
})
export class CessationService {
  private readonly baseUrl = `${environment.apiUrl}/cessation`;

  constructor(private readonly http: HttpClient) {}

  cesserUser(id: number, motifCessation: string): Observable<void> {
    const body: CessationRequest = { motifCessation };
    return this.http.post<void>(`${this.baseUrl}/users/${id}/cesser`, body);
  }

  reactiverUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${id}/reactiver`, {});
  }
}
