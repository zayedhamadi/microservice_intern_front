import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { Interview } from '../models/interview';

export type RecrutementInterviewType = 'rh-initial' | 'technique' | 'rh-final';

export interface PlanifierEntretienPayload {
  mode: 'TELEPHONIQUE' | 'DISTANCIEL' | 'PRESENTIEL';
  dateEntretien: string;
  lieu?: string;
  lienVisio?: string;
}

export interface PlanificationCandidatureContext {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  posteRecrutement: string;
  typeEntretien: RecrutementInterviewType;
}

@Injectable({ providedIn: 'root' })
export class RecrutementInterviewService {
  private readonly baseUrl = `${environment.apiUrl}/rh/api/candidatures`;
  private readonly entretiensUrl = `${environment.apiUrl}/rh/api/entretiens`;

  constructor(private http: HttpClient) {}

  /**
   * Planifie l'entretien réel lié à une candidature : met à jour le statut de
   * la candidature côté back ET envoie la convocation par email au candidat
   * (RecrutementMail.sendEntretienConvocation).
   */
  planifier(
    applicationId: string,
    type: RecrutementInterviewType,
    payload: PlanifierEntretienPayload,
  ): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${applicationId}/entretiens/${type}`,
      payload,
    );
  }

  /**
   * Récupère tous les entretiens issus du workflow candidature (Interview),
   * au format CalendarInterviewDto, pour affichage dans le calendrier RH
   * aux côtés des entretiens libres (CalendarInterview).
   * Correspond à GET /rh/api/entretiens -> InterviewService.getAllRecrutementAsCalendar()
   */
  getAll(): Observable<Interview[]> {
    return this.http.get<Interview[]>(this.entretiensUrl);
  }
}
