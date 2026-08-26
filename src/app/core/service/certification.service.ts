import { HttpParams } from '@angular/common/http';
import { PageResponse } from '../models/PageResponse';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environement/environment';
import { CertificationDTO } from '../models/CertificationDTO';

@Injectable({ providedIn: 'root' })
export class CertificationService {
  private readonly CERTIF_URL = `${environment.apiUrl}/certifications`;

  constructor(private http: HttpClient) {}
  getCertificationsPaged(
    keycloakId: string,
    page = 0,
    size = 6,
    sortBy = 'dateCertif',
    sortDir: 'asc' | 'desc' = 'desc',
    titre?: string,
  ): Observable<PageResponse<CertificationDTO>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    if (titre) params = params.set('titre', titre);

    return this.http.get<PageResponse<CertificationDTO>>(
      `${this.CERTIF_URL}/admin/user/${keycloakId}/certifications/page`,
      { params },
    );
  }
  getCertificationssByUserId(
    keycloakId: string,
  ): Observable<CertificationDTO[]> {
    return this.http
      .get<
        CertificationDTO[]
      >(`${this.CERTIF_URL}/admin/user/${keycloakId}/certifications`)
      .pipe(catchError(() => of([])));
  }

  getCertificationsssByUserId(userId: number): Observable<CertificationDTO[]> {
    return this.http
      .get<
        CertificationDTO[]
      >(`${this.CERTIF_URL}/admin/user-by-id/${userId}/certifications`)
      .pipe(catchError(() => of([])));
  }

  getMyCertifications(): Observable<CertificationDTO[]> {
    return this.http.get<CertificationDTO[]>(`${this.CERTIF_URL}/getMine`);
  }

  getCertificationsByUserId(userId: number): Observable<CertificationDTO[]> {
    return this.http
      .get<
        CertificationDTO[]
      >(`${this.CERTIF_URL}/admin/certifications/user/${userId}`)
      .pipe(catchError(() => of([])));
  }

  addCertification(
    dto: Partial<CertificationDTO>,
  ): Observable<CertificationDTO> {
    return this.http.post<CertificationDTO>(`${this.CERTIF_URL}/add`, dto);
  }

  updateCertification(
    id: string,
    dto: Partial<CertificationDTO>,
  ): Observable<CertificationDTO> {
    return this.http.put<CertificationDTO>(`${this.CERTIF_URL}/${id}`, dto);
  }

  deleteCertification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.CERTIF_URL}/${id}`);
  }

  getCertificationById(certifId: string): Observable<CertificationDTO> {
    return this.http.get<CertificationDTO>(`${this.CERTIF_URL}/${certifId}`);
  }
}