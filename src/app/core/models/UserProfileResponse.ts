// core/models/user-profile.model.ts
export interface UserProfileResponse {
  id: number;
  matricule: string | null;
  nom: string;
  prenom: string;
  email: string;
  role: 'RH' | 'EMPLOYEE' | 'CANDIDAT';
  etatCompte: string;
  image: string | null;
  numTel?: string | null;
  adresse?: string | null;
  genre?: string | null;
  dateNaissance?: string | null;
  dateInscrit?: string;
}
