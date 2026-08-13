import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { PosteRecrutment } from '../models/PosteRecrutment';
import { HttpParams } from '@angular/common/http';
import { FiltrePostesAvecCandidatures, PosteAvecCandidatures } from '../models/Poste avec candidatures';

@Injectable({
  providedIn: 'root',
})
export class PosteRecutementService {
  private readonly recrutementUrl = `${environment.apiUrl}/rh/api/postesRecrutement`;
  private readonly departementUrl = `${environment.apiUrl}/api/departements`;

  constructor(private http: HttpClient) { }

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

  getPostesAvecCandidatures(
    filtre: FiltrePostesAvecCandidatures,
  ): Observable<PosteAvecCandidatures[]> {
    let params = new HttpParams();
 
    if (filtre.departementNom) {
      params = params.set('departementNom', filtre.departementNom);
    }
    if (filtre.status) {
      params = params.set('status', filtre.status);
    }
    if (filtre.typeContrat) {
      params = params.set('typeContrat', filtre.typeContrat);
    }
    if (filtre.workType) {
      params = params.set('workType', filtre.workType);
    }
    if (filtre.search) {
      params = params.set('search', filtre.search);
    }
    if (filtre.avecCandidatsUniquement !== undefined) {
      params = params.set(
        'avecCandidatsUniquement',
        String(filtre.avecCandidatsUniquement),
      );
    }
    if (filtre.sortBy) {
      params = params.set('sortBy', filtre.sortBy);
    }
    if (filtre.sortDir) {
      params = params.set('sortDir', filtre.sortDir);
    }
 
    return this.http.get<PosteAvecCandidatures[]>(
      `${this.recrutementUrl}/avec-candidatures`,
      { params },
    );
  }
}
