// core/service/stats.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly MANAGER_URL = `${environment.apiUrl}/EmployeeManagementController`;

  constructor(private http: HttpClient) {}

  getUsersStats(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/users`);
  }

  getRHStats(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/rh`);
  }

  getEmployeesStats(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/employees`);
  }

  getCandidatsStats(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/candidats`);
  }

  getInactifsStats(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/inactifs`);
  }

  getGenreByRole(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/genre-by-role`);
  }

  getStatusByRole(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/status-by-role`);
  }

  getMonthlyRegistrations(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/stats/monthly-registrations`);
  }

  getMonthlyInscrVsCessation(): Observable<any> {
    return this.http.get(
      `${this.MANAGER_URL}/stats/monthly-inscr-vs-cessation`,
    );
  }

  getLast5Users(): Observable<any> {
    return this.http.get(`${this.MANAGER_URL}/last5Users`);
  }

  getActivities(limit = 20): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.MANAGER_URL}/activities?limit=${limit}`,
    );
  }

  clearActivities(): Observable<void> {
    return this.http.delete<void>(`${this.MANAGER_URL}/activities`);
  }
}
