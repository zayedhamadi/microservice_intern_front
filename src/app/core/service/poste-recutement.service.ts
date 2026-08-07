import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { PosteRecrutment } from '../models/PosteRecrutment';

@Injectable({
  providedIn: 'root',
})
export class PosteRecutementService {
  private readonly recrutementUrl = `${environment.apiUrl}/rh/api/postesRecrutement`;
  private readonly departementUrl = `${environment.apiUrl}/api/departements`;

  constructor(private http: HttpClient) {}

  getAllPostes(): Observable<any[]> {
    return this.http.get<any[]>(this.recrutementUrl);
  }

  createPoste(poste: any): Observable<any> {
    return this.http.post(this.recrutementUrl, poste);
  }

  getPosteById(id: string): Observable<any> {
    return this.http.get(`${this.recrutementUrl}/${id}`);
  }

  getPostesByDepartement(departementNom: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.recrutementUrl}/departement/${departementNom}`,
    );
  }

  deletePoste(id: string): Observable<void> {
    return this.http.delete<void>(`${this.recrutementUrl}/${id}`);
  }
  updatePoste(id: string, poste: PosteRecrutment): Observable<PosteRecrutment> {
    return this.http.put(`${this.recrutementUrl}/${id}`, poste);
  }

  getDepartements(): Observable<string[]> {
    return this.http.get<string[]>(this.departementUrl);
  }
}
