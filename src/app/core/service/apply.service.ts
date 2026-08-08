import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicationDto } from '../models/Application';
import { environment } from '../environement/environment';

@Injectable({ providedIn: 'root' })
export class ApplyService {
  private readonly baseUrl = `${environment.apiUrl}/rh/api/candidatures`;

  constructor(private http: HttpClient) {}

  postulerAvecCvExistant(
    idPosteRecrutement: string,
    lettreMotivationTexte?: string,
    lettreMotivationPdf?: File,
  ): Observable<ApplicationDto> {
    const formData = new FormData();
    formData.append('idPosteRecrutement', idPosteRecrutement);
    if (lettreMotivationTexte) {
      formData.append('lettreMotivationTexte', lettreMotivationTexte);
    }
    if (lettreMotivationPdf) {
      formData.append('lettreMotivationPdf', lettreMotivationPdf);
    }
    return this.http.post<ApplicationDto>(this.baseUrl, formData);
  }

  /** Postuler avec un CV téléversé spécifiquement pour cette candidature. */
  postulerAvecNouveauCv(
    idPosteRecrutement: string,
    cv: File,
    lettreMotivationTexte?: string,
    lettreMotivationPdf?: File,
  ): Observable<ApplicationDto> {
    const formData = new FormData();
    formData.append('idPosteRecrutement', idPosteRecrutement);
    formData.append('cv', cv);
    if (lettreMotivationTexte) {
      formData.append('lettreMotivationTexte', lettreMotivationTexte);
    }
    if (lettreMotivationPdf) {
      formData.append('lettreMotivationPdf', lettreMotivationPdf);
    }
    return this.http.post<ApplicationDto>(
      `${this.baseUrl}/avec-nouveau-cv`,
      formData,
    );
  }

  getMaCandidaturePourPoste(posteId: string): Observable<ApplicationDto> {
    return this.http.get<ApplicationDto>(
      `${this.baseUrl}/mon-statut/${posteId}`,
    );
  }

  retirerCandidature(idApplication: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idApplication}`);
  }
}
