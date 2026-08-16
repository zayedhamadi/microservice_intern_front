import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { Interview, InterviewPage, InterviewStats } from '../models/interview';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly baseUrl = `${environment.apiUrl}/interviews`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Interview[]> {
    return this.http.get<Interview[]>(this.baseUrl);
  }
  getPage(
    page: number,
    size: number,
    search?: string,
    status?: string,
  ): Observable<InterviewPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<InterviewPage>(`${this.baseUrl}/search`, { params });
  }
  getById(id: string): Observable<Interview> {
    return this.http.get<Interview>(`${this.baseUrl}/${id}`);
  }
  create(interview: Interview): Observable<Interview> {
    return this.http.post<Interview>(this.baseUrl, interview);
  }
  update(id: string, interview: Interview): Observable<Interview> {
    return this.http.put<Interview>(`${this.baseUrl}/${id}`, interview);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  getStats(): Observable<InterviewStats[]> {
    return this.http.get<InterviewStats[]>(`${this.baseUrl}/stats`);
  }
  checkAvailability(
    date: string,
    startTime: string,
    endTime: string,
    interviewerName: string,
    excludeId?: string,
  ): Observable<{ available: boolean }> {
    let params = new HttpParams()
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime)
      .set('interviewerName', interviewerName);
    if (excludeId) params = params.set('excludeId', excludeId);
    return this.http.get<{ available: boolean }>(
      `${this.baseUrl}/availability`,
      { params },
    );
  }
}
