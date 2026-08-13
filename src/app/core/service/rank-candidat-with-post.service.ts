import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PosteClasseDto } from '../models/PosteClasse';
import { environment } from '../environement/environment';


@Injectable({
  providedIn: 'root',
})
export class RankCandidatWithPostService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl; 

  getPostesRecommandes(): Observable<PosteClasseDto[]> {
    return this.http.get<PosteClasseDto[]>(
      `${this.baseUrl}/candidat/postes/recommandes`,
    );
  }
}
