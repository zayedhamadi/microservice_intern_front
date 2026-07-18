import { CertificationDTO } from "./CertificationDTO";

export interface UserDetailFullResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  etatCompte: string;
  genre?: string | null;
  adresse?: string | null;
  description?: string | null;
  numTel?: string | null;
  dateNaissance?: string | null;
  dateInscrit?: string | null;
  matricule?: string | null;
  image?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  siteweb?: string | null;
  specialiteEtude?: string | null;
  universiteEtude?: string | null;
  niveauEtude?: string | null;
  anneesExperience?: number | null;
  certifications?: CertificationDTO[];
  // Bloc cessation (jointure Cessation)
  motifCessation?: string | null;
  dateCessation?: string | null;
  motifReactivation?: string | null;
}