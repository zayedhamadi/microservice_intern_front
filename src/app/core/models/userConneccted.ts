export interface DepartementRef {
  id: number;
  nom: string;
}

export interface PosteRef {
  id: number;
  nom: string;
}

export interface ResponsableRef {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

export interface PositionHistoryEntry {
  posteNom: string;
  departementNom: string;
  dateDebut: string;
  dateFin: string | null;
  actuel: boolean;
  commentaire?: string;
}

export interface UserCommonProfile {
  id: number;
  matricule: string;
  keycloakId: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  genre: string;
  adresse: string;
  description: string;
  num_Tel: number;
  dateNaissance: string;
  specialiteEtude: string;
  universiteEtude: string;
  niveauEtude: string;
  anneesExperience: number;
  linkedin: string;
  twitter: string;
  siteweb: string;
  etatCompte: string;
  imageBase64: string;
  cvBase64: string;
  profileComplete: boolean;
  missingFields: string[];
  requiresEtudes: boolean;
}

export interface UserFullProfile {
  departementActuel?: DepartementRef;
  posteActuel?: PosteRef;
  responsable?: ResponsableRef;
  positionHistory?: PositionHistoryEntry[];
}
