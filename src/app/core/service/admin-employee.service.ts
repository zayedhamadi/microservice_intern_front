import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment'; // ⚠️ ajuste le chemin selon l'emplacement réel
import { CreateEmployeeRequest, CreateEmployeeResponse } from '../models/create-employee';

@Injectable({ providedIn: 'root' })
export class AdminEmployeeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createEmployee(dto: CreateEmployeeRequest): Observable<CreateEmployeeResponse> {
    return this.http.post<CreateEmployeeResponse>(
      `${this.apiUrl}/EmployeeManagementController/admin/register`,
      dto,
    );
  }
}