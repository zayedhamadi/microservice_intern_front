import { Role, Genre, Compte } from "./enum";


export interface Cessation {
  id: number;
  motifCessation: string;
  dateCessation: string;
}

export interface User {
  id: number;
  keycloakId: string;
  email: string;
  nom: string;
  prenom: string;
  adresse?: string;
  description?: string;
  dateNaissance?: string;
  dateInscrit?: string;
  num_Tel?: number;
  role: Role;
  genre?: Genre;
  etatCompte: Compte;
  image?: string | null;
  cessation?: Cessation;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: Role;
  genre?: Genre;
  adresse?: string;
  num_Tel?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  id: number;
  keycloakId: string;
}

export interface CompleteProfileRequest {
  role?: Role;
  genre?: Genre;
  dateNaissance?: string | null;
  num_Tel?: number | null;
  adresse?: string | null;
  description?: string | null;
  imageBase64?: string | null;
}

export interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  adresse?: string;
  description?: string;
  dateNaissance?: string;
  num_Tel?: number;
  genre?: Genre;
}

export interface UserInfo {
  id?: number | string;
  keycloakId?: string;
  email?: string;
  nom?: string;
  prenom?: string;
  role?: Role | string;
}
