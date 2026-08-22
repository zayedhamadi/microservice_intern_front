import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { Interview, InterviewPage, InterviewStats } from '../models/interview';
import { PosteEntretiensTechniques } from '../models/poste-entretien-technique';
import {
  InterviewResult,
  InterviewMode,
} from '../models/enums/enumPosteRecrutemnt';

export interface PlanifierEntretienPayload {
  mode: InterviewMode;
  dateEntretien: string; // format ISO attendu par LocalDateTime, ex: "2026-08-25T10:00:00"
  lieu?: string;
  lienVisio?: string;
}

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly baseUrl = `${environment.apiUrl}/interviews`;
  private readonly candidaturesUrl = `${environment.apiUrl}/rh/api/candidatures`;

  constructor(private http: HttpClient) {}

  getEntretiensTechniquesParPoste(): Observable<PosteEntretiensTechniques[]> {
    return this.http.get<PosteEntretiensTechniques[]>(
      `${environment.apiUrl}/rh/api/entretiens/techniques-par-poste`,
    );
  }

  /** Historique complet des entretiens (RH initial, technique, RH final) pour une candidature */
  getEntretiensPourCandidature(applicationId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(
      `${this.candidaturesUrl}/${applicationId}/entretiens`,
    );
  }

  // ==================== Planification (workflow candidature) ====================

  /** Étape 2 : SELECTIONNE -> EN_ENTRETIEN_RH */
  planifierEntretienRhInitial(
    applicationId: string,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http.post<Interview>(
      `${this.candidaturesUrl}/${applicationId}/entretiens/rh-initial`,
      dto,
    );
  }

  /** Étape 4 : planifie l'entretien technique (statut doit déjà être EN_ENTRETIEN_TECHNIQUE) */
  planifierEntretienTechnique(
    applicationId: string,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http.post<Interview>(
      `${this.candidaturesUrl}/${applicationId}/entretiens/technique`,
      dto,
    );
  }

  /** Étape 6 : planifie l'entretien final (statut doit déjà être EN_ENTRETIEN_FINAL) */
  planifierEntretienRhFinal(
    applicationId: string,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http.post<Interview>(
      `${this.candidaturesUrl}/${applicationId}/entretiens/rh-final`,
      dto,
    );
  }

  /** Étapes 3, 5, 7 : enregistre le résultat d'un entretien planifié -> fait avancer (ou rejette) la candidature */
  enregistrerResultat(
    interviewId: string,
    dto: { resultat: InterviewResult; notes?: string },
  ): Observable<Interview> {
    return this.http.patch<Interview>(
      `${environment.apiUrl}/rh/api/entretiens/${interviewId}/resultat`,
      dto,
    );
  }

  // ==================== Reste inchangé ====================

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
  getMesEntretiens(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.baseUrl}/mes-entretiens`);
  }
}
