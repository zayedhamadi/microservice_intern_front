import { Compte, Role } from "./enums/enumUser";

export interface UserProfile {
  keycloakId: string;
  role?: Role;
  nom: string;
  prenom: string;
  email: string;
  adresse?: string;
  numTel?: number;
  specialiteEtude?: string;
  niveauEtude?: string;
  universiteEtude?: string;
  compte?: Compte;
  anneesExperience?: number;
  linkedin?: string;
  matricule?: string;
  imageBase64?: string;   
}