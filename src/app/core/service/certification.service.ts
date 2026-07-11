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
    id: number,
    dto: Partial<CertificationDTO>,
  ): Observable<CertificationDTO> {
    return this.http.put<CertificationDTO>(`${this.CERTIF_URL}/${id}`, dto);
  }

  deleteCertification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.CERTIF_URL}/${id}`);
  }

  getCertificationById(certifId: number): Observable<CertificationDTO> {
    return this.http.get<CertificationDTO>(`${this.CERTIF_URL}/${certifId}`);
  }
}
