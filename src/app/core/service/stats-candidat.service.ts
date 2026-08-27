import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CandidateDashboardStatsDto } from '../models/candidatstats';

import { environment } from '../environement/environment';
@Injectable({
  providedIn: 'root',
})
export class StatsCandidatService {

  private readonly baseUrl = `${environment.apiUrl}/api/recrutement/candidat/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<CandidateDashboardStatsDto> {
    return this.http.get<CandidateDashboardStatsDto>(this.baseUrl);
  }
}
