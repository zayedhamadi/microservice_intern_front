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

  modifierCandidature(
    idApplication: string,
    lettreMotivationTexte?: string,
    cv?: File,
    lettreMotivationPdf?: File,
    supprimerLettrePdf = false,
  ): Observable<ApplicationDto> {
    const formData = new FormData();
    if (lettreMotivationTexte) {
      formData.append('lettreMotivationTexte', lettreMotivationTexte);
    }
    if (cv) {
      formData.append('cv', cv);
    }
    if (lettreMotivationPdf) {
      formData.append('lettreMotivationPdf', lettreMotivationPdf);
    }
    formData.append('supprimerLettrePdf', String(supprimerLettrePdf));
    return this.http.put<ApplicationDto>(
      `${this.baseUrl}/${idApplication}`,
      formData,
    );
  }

  getMaCandidaturePourPoste(posteId: string): Observable<ApplicationDto> {
    return this.http.get<ApplicationDto>(
      `${this.baseUrl}/mon-statut/${posteId}`,
    );
  }

  getMesCandidatures(): Observable<ApplicationDto[]> {
    return this.http.get<ApplicationDto[]>(`${this.baseUrl}/mes-candidatures`);
  }

  retirerCandidature(idApplication: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idApplication}`);
  }

  telechargerLettreMotivation(idApplication: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${idApplication}/lettre-motivation`, {
      responseType: 'blob',
    });
  }
}
