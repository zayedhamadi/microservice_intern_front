import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environement/environment';
import { DemanderReportPayload, Reprogrammer, TraiterDemandeReportPayload } from '../models/Reprogramme';

@Injectable({ providedIn: 'root' })
export class ReprogrammerService {
  private readonly entretiensUrl = `${environment.apiUrl}/rh/api/entretiens`;

  constructor(private http: HttpClient) {}

  demanderParCandidat(interviewId: string, dto: DemanderReportPayload) {
    return this.http
      .post<Reprogrammer>(
        `${this.entretiensUrl}/${interviewId}/reprogrammer/demande`,
        dto,
      )
      .pipe(catchError(this.handleError));
  }

  proposerParIntervenant(interviewId: string, dto: DemanderReportPayload) {
    return this.http
      .post<Reprogrammer>(
        `${this.entretiensUrl}/${interviewId}/reprogrammer/proposition`,
        dto,
      )
      .pipe(catchError(this.handleError));
  }

  demanderReactivationApresAbsence(
    interviewId: string,
    dto: DemanderReportPayload,
  ) {
    return this.http
      .post<Reprogrammer>(
        `${this.entretiensUrl}/${interviewId}/reprogrammer/reactivation-absence`,
        dto,
      )
      .pipe(catchError(this.handleError));
  }

  accepter(demandeId: string) {
    return this.http
      .patch<Reprogrammer>(`${this.entretiensUrl}/${demandeId}/accepter`, {})
      .pipe(catchError(this.handleError));
  }

  refuser(demandeId: string, dto: TraiterDemandeReportPayload) {
    return this.http
      .patch<Reprogrammer>(`${this.entretiensUrl}/${demandeId}/refuser`, dto)
      .pipe(catchError(this.handleError));
  }

  getPourEntretien(interviewId: string) {
    return this.http
      .get<Reprogrammer[]>(`${this.entretiensUrl}/${interviewId}/reprogrammer`)
      .pipe(catchError(this.handleError));
  }

  getMesDemandes() {
    return this.http
      .get<Reprogrammer[]>(`${this.entretiensUrl}/reprogrammer/mes-demandes`)
      .pipe(catchError(this.handleError));
  }

  getATraiter() {
    return this.http
      .get<Reprogrammer[]>(`${this.entretiensUrl}/reprogrammer/a-traiter`)
      .pipe(catchError(this.handleError));
  }

  aUneDemandeEnAttente(demandes: Reprogrammer[]): boolean {
    return demandes.some((d) => d.statut === 'EN_ATTENTE');
  }

  private handleError = (err: HttpErrorResponse) => {
    let message = err.error?.message ?? 'Une erreur est survenue';
    if (err.status === 409)
      message = 'Cette demande a été modifiée entre-temps. Rechargez la page.';
    if (err.status === 403)
      message =
        err.error?.message ??
        "Vous n'êtes pas autorisé à effectuer cette action";
    if (err.status === 400) message = err.error?.message ?? message;
    return throwError(() => ({ ...err, message }));
  };
} 