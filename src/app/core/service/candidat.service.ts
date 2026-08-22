import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { Interview, InterviewStats } from '../models/interview';
import {
  InterviewStatus,
  InterviewType,
} from '../models/enums/enumPosteRecrutemnt';
import { CandidatInterviewFilters, CandidatInterviewPage } from '../models/CandidatInterviewFilters';



@Injectable({
  providedIn: 'root',
})
export class CandidatService {
  private readonly baseUrl = `${environment.apiUrl}/candidat/api/entretiens`;

  constructor(private http: HttpClient) {}

  /** Liste paginée + filtrable (type, statut, recherche texte) */
  getMesEntretiens(
    filters: CandidatInterviewFilters = {},
  ): Observable<CandidatInterviewPage> {
    let params = new HttpParams()
      .set('page', (filters.page ?? 0).toString())
      .set('size', (filters.size ?? 10).toString());

    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);

    return this.http.get<CandidatInterviewPage>(this.baseUrl, { params });
  }

  /** Détail d'un entretien précis (avec vérification d'appartenance côté back) */
  getEntretienById(id: string): Observable<Interview> {
    return this.http.get<Interview>(`${this.baseUrl}/${id}`);
  }

  /** Tous mes entretiens d'un type donné (RH_INITIAL / TECHNIQUE / RH_FINAL) */
  getEntretiensParType(type: InterviewType): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.baseUrl}/type/${type}`);
  }

  /** Répartition de mes entretiens par statut (pour un dashboard/KPI) */
  getStats(): Observable<InterviewStats[]> {
    return this.http.get<InterviewStats[]>(`${this.baseUrl}/stats`);
  }

  /** Prochain entretien à venir (null / 204 si aucun) */
  getProchainEntretien(): Observable<Interview | null> {
    return this.http.get<Interview | null>(`${this.baseUrl}/prochain`);
  }

  /** Répartition de mes candidatures par ApplicationStatus */
  getEtatCandidatures(): Observable<InterviewStats[]> {
    return this.http.get<InterviewStats[]>(`${this.baseUrl}/candidatures/etat`);
  }
}
