import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApplicationStatsDto,
  InterviewsStatsDto,
  PostesStatsDto,
  ReprogrammerStatsDto,
  DashboardStatsDto,
} from '../models/statsRH';

import { environment } from '../environement/environment';


@Injectable({
  providedIn: 'root',
})
export class StatsRHService {
  private readonly baseUrl = `${environment.apiUrl}/api/recrutement/stats`;

  constructor(private readonly http: HttpClient) {}

  getApplicationsStats(): Observable<ApplicationStatsDto> {
    return this.http.get<ApplicationStatsDto>(`${this.baseUrl}/applications`);
  }

  getInterviewsStats(): Observable<InterviewsStatsDto> {
    return this.http.get<InterviewsStatsDto>(`${this.baseUrl}/interviews`);
  }

  getPostesStats(): Observable<PostesStatsDto> {
    return this.http.get<PostesStatsDto>(`${this.baseUrl}/postes`);
  }

  getReprogrammationsStats(): Observable<ReprogrammerStatsDto> {
    return this.http.get<ReprogrammerStatsDto>(
      `${this.baseUrl}/reprogrammations`,
    );
  }

  getDashboard(): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.baseUrl}/dashboard`);
  }
}
