import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { DepartementDTO } from '../models/departement';

@Injectable({
  providedIn: 'root',
})
export class DepartementService {
  private readonly apiUrl = `${environment.apiUrl}/api/departements`;

  constructor(private readonly http: HttpClient) {}

  getDepartementByName(nom: string): Observable<DepartementDTO> {
    return this.http.get<DepartementDTO>(`${this.apiUrl}/${nom}`);
  }

  getAllDepartements(): Observable<DepartementDTO[]> {
    return this.http.get<DepartementDTO[]>(this.apiUrl);
  }

  createDepartement(departement: DepartementDTO): Observable<DepartementDTO> {
    return this.http.post<DepartementDTO>(this.apiUrl, departement);
  }

  updateDepartement(
    nom: string,
    departement: DepartementDTO,
  ): Observable<DepartementDTO> {
    return this.http.put<DepartementDTO>(`${this.apiUrl}/${nom}`, departement);
  }

  deleteDepartement(nom: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${nom}`);
  }
}
