// interview.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environement/environment';
import { Interview, InterviewPage, InterviewStats } from '../models/interview';
import { PosteEntretiensTechniques } from '../models/poste-entretien-technique';
import {
  InterviewResult,
  InterviewMode,
} from '../models/enums/enumPosteRecrutemnt';

// ==================== DTOs ====================

export interface PlanifierEntretienPayload {
  mode: InterviewMode;
  dateEntretien: string; // ISO LocalDateTime, ex: "2026-08-25T10:00:00"
  lieu?: string;
  lienVisio?: string;
}

export interface ResultatEntretienDto {
  resultat: InterviewResult;
  notes?: string;
}

export interface AnnulerEntretienDto {
  motif?: string;
}

export interface ReporterEntretienDto {
  nouvelleDate: string; // ISO LocalDateTime, doit être dans le futur
}

export type RecrutementInterviewType = 'rh-initial' | 'technique' | 'rh-final';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly baseUrl = `${environment.apiUrl}/interviews`;
  private readonly candidaturesUrl = `${environment.apiUrl}/rh/api/candidatures`;
  private readonly entretiensUrl = `${environment.apiUrl}/rh/api/entretiens`;

  constructor(private http: HttpClient) {}

  // ==================== CRUD entretiens LIBRE ====================

  getAll(): Observable<Interview[]> {
    return this.http
      .get<Interview[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
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
    return this.http
      .get<InterviewPage>(`${this.baseUrl}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<Interview> {
    return this.http
      .get<Interview>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** Crée un entretien LIBRE (hors workflow candidature) */
  create(interview: Interview): Observable<Interview> {
    return this.http
      .post<Interview>(this.baseUrl, interview)
      .pipe(catchError(this.handleError));
  }

  /** Modifie un entretien LIBRE */
  update(id: string, interview: Interview): Observable<Interview> {
    return this.http
      .put<Interview>(`${this.baseUrl}/${id}`, interview)
      .pipe(catchError(this.handleError));
  }

  /**
   * Supprime un entretien — LIBRE uniquement.
   * Le backend renvoie 400 (TransitionStatutInvalideException) si
   * source = CANDIDATURE. Utilise canDelete() côté UI pour ne même pas
   * proposer le bouton dans ce cas.
   */
  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getStats(): Observable<InterviewStats[]> {
    return this.http
      .get<InterviewStats[]>(`${this.baseUrl}/stats`)
      .pipe(catchError(this.handleError));
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
    return this.http
      .get<{ available: boolean }>(`${this.baseUrl}/availability`, { params })
      .pipe(catchError(this.handleError));
  }

  getMesEntretiens(): Observable<Interview[]> {
    return this.http
      .get<Interview[]>(`${this.baseUrl}/mes-entretiens`)
      .pipe(catchError(this.handleError));
  }

  /** Entretiens techniques actifs assignés à l'employee connecté */
  getMesCandidatsTechniques(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.entretiensUrl}/mes-candidats-techniques`)
      .pipe(catchError(this.handleError));
  }

  // ==================== Lecture agrégée (RH / EMPLOYEE) ====================

  /** Tous les entretiens issus du workflow candidature (source = CANDIDATURE) */
  getAllCandidature(): Observable<Interview[]> {
    return this.http
      .get<Interview[]>(this.entretiensUrl)
      .pipe(catchError(this.handleError));
  }

  getEntretiensTechniquesParPoste(): Observable<PosteEntretiensTechniques[]> {
    return this.http
      .get<PosteEntretiensTechniques[]>(`${this.entretiensUrl}/techniques-par-poste`)
      .pipe(catchError(this.handleError));
  }

  /** Historique complet des entretiens (RH initial, technique, RH final) pour une candidature */
  getEntretiensPourCandidature(applicationId: string): Observable<Interview[]> {
    return this.http
      .get<Interview[]>(`${this.candidaturesUrl}/${applicationId}/entretiens`)
      .pipe(catchError(this.handleError));
  }

  // ==================== Planification (workflow candidature) ====================

  /** Étape 2 : SELECTIONNE -> EN_ENTRETIEN_RH */
  planifierEntretienRhInitial(
    applicationId: string,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http
      .post<Interview>(`${this.candidaturesUrl}/${applicationId}/entretiens/rh-initial`, dto)
      .pipe(catchError(this.handleError));
  }

  /** Étape 4 : planifie l'entretien technique (statut doit déjà être EN_ENTRETIEN_TECHNIQUE) */
  planifierEntretienTechnique(
    applicationId: string,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http
      .post<Interview>(`${this.candidaturesUrl}/${applicationId}/entretiens/technique`, dto)
      .pipe(catchError(this.handleError));
  }

  /** Étape 6 : planifie l'entretien final (statut doit déjà être EN_ENTRETIEN_FINAL) */
  planifierEntretienRhFinal(
    applicationId: string,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http
      .post<Interview>(`${this.candidaturesUrl}/${applicationId}/entretiens/rh-final`, dto)
      .pipe(catchError(this.handleError));
  }

  /** Générique, équivalent aux 3 méthodes ci-dessus si tu préfères un seul point d'appel */
  planifier(
    applicationId: string,
    type: RecrutementInterviewType,
    dto: PlanifierEntretienPayload,
  ): Observable<Interview> {
    return this.http
      .post<Interview>(`${this.candidaturesUrl}/${applicationId}/entretiens/${type}`, dto)
      .pipe(catchError(this.handleError));
  }

  /** Étapes 3, 5, 7 : enregistre le résultat -> fait avancer ou rejette la candidature */
  enregistrerResultat(
    interviewId: string,
    dto: ResultatEntretienDto,
  ): Observable<Interview> {
    return this.http
      .patch<Interview>(`${this.entretiensUrl}/${interviewId}/resultat`, dto)
      .pipe(catchError(this.handleError));
  }

  /** Annule un entretien PLANIFIE/REPORTE -> libère activeSlotKey, remet le statut candidature en arrière */
  annulerEntretien(interviewId: string, motif?: string): Observable<Interview> {
    const body: AnnulerEntretienDto = motif ? { motif } : {};
    return this.http
      .patch<Interview>(`${this.entretiensUrl}/${interviewId}/annuler`, body)
      .pipe(catchError(this.handleError));
  }

  /** Marque le candidat absent -> rejette automatiquement la candidature */
  marquerAbsent(interviewId: string): Observable<Interview> {
    return this.http
      .patch<Interview>(`${this.entretiensUrl}/${interviewId}/absent`, {})
      .pipe(catchError(this.handleError));
  }

  /** Reporte un entretien actif à une nouvelle date (doit être dans le futur) */
  reporterEntretien(interviewId: string, nouvelleDate: string): Observable<Interview> {
    const body: ReporterEntretienDto = { nouvelleDate };
    return this.http
      .patch<Interview>(`${this.entretiensUrl}/${interviewId}/reporter`, body)
      .pipe(catchError(this.handleError));
  }

  // ==================== Helpers UI (pas d'appel HTTP) ====================

  /** Seul un entretien LIBRE peut être supprimé (voir InterviewService#delete côté backend) */
  canDelete(interview: Interview): boolean {
    return interview.source === 'LIBRE';
  }

  /** Un entretien de candidature encore actif peut être annulé/reporté/marqué absent */
  isActif(interview: Interview): boolean {
    return interview.status === 'PLANIFIE' || interview.status === 'REPORTE';
  }

  canAnnuler(interview: Interview): boolean {
    return interview.source === 'CANDIDATURE' && this.isActif(interview);
  }

  canReporter(interview: Interview): boolean {
    return this.isActif(interview);
  }

  canMarquerAbsent(interview: Interview): boolean {
    return interview.source === 'CANDIDATURE' && this.isActif(interview);
  }

  // ==================== Gestion d'erreurs centralisée ====================

  private handleError = (err: HttpErrorResponse) => {
    let message = err.error?.message ?? 'Une erreur est survenue';

    switch (err.status) {
      case 409:
        message = 'Cette candidature/cet entretien a été modifié entre-temps. Rechargez la page.';
        break;
      case 403:
        message = err.error?.message ?? "Vous n'êtes pas autorisé à effectuer cette action";
        break;
      case 400:
        // TransitionStatutInvalideException côté back renvoie déjà un message clair
        message = err.error?.message ?? message;
        break;
    }

    return throwError(() => ({ ...err, message }));
  };
} 