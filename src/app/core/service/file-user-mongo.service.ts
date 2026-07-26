import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { CvDto } from '../models/CvDto';



@Injectable({
  providedIn: 'root',
})
export class FileUserMongoService {
  private readonly apiUrl = `${environment.apiUrl}/cv`;

  constructor(private readonly http: HttpClient) {}

  getMyCv(): Observable<CvDto> {
    return this.http.get<CvDto>(`${this.apiUrl}/me`);
  }

  uploadCv(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(this.apiUrl, formData);
  }

  deleteCv(): Observable<void> {
    return this.http.delete<void>(this.apiUrl);
  }
}
