import { Role, NiveauEtude, Genre } from './enum';

export interface CompleteProfileRequest {
  role?: Role;
  genre?: Genre;
  dateNaissance?: string | null;
  num_Tel?: number | null;
  adresse?: string | null;
  description?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  siteweb?: string | null;
  specialiteEtude?: string | null;
  universiteEtude?: string | null;
  niveauEtude?: NiveauEtude | null;
  anneesExperience?: number | null;
  imageBase64?: string | null;
  cvBase64?: string | null;
}
