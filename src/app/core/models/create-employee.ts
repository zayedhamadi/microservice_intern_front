import { Role } from './enum';

export interface CreateEmployeeRequest {
  nom: string;
  prenom: string;
  email: string;
  role: Role;
}

export interface CreateEmployeeResponse {
  message: string;
  id: number;
  email: string;
  matricule: string;
}
