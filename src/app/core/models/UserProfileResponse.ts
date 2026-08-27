import { Role } from "./enums/enumUser";

export interface UserProfileResponse {
  id: number;
  KeycloakId?: string;
  matricule: string | null;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  etatCompte: string;
  image: string | null;
  numTel?: string | null;
  adresse?: string | null;
  genre?: string | null;
  dateNaissance?: string | null;
  dateInscrit?: string;
}
