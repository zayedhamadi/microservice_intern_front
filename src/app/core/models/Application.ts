import { ApplicationStatus } from './enums/enumPosteRecrutemnt';

export interface StatusChange {
  statut?: ApplicationStatus;
  date?: string;
  commentaire?: string;
  auteurKeycloakId?: string;
}

export interface ChangerStatutDto {
  nouveauStatut: ApplicationStatus;
  commentaireRH?: string;
}
export interface ApplicationDto {
  idApplication?: string;
  candidatKeycloakId?: string;
  posteRecrutementId?: string;

  cvSnapshotFileName?: string;
  lettreMotivationTexte?: string;
  lettreMotivationPdfPresente?: boolean;
  lettreMotivationPdfFileName?: string;

  nomComplet?: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  formation?: string;
  commentaireRH?: string;

  experience?: string;
  anneesExperienceCandidat?: number;
  competences?: string[];
  langues?: string[];

  statut?: ApplicationStatus;

  dateCandidature?: string;
  dateDernierChangementStatut?: string;

  scoreMatching?: number;
  historiqueStatuts?: StatusChange[];
}

export interface ApplyRequestDto {
  idPosteRecrutement: string;
  lettreMotivationTexte?: string;
}
