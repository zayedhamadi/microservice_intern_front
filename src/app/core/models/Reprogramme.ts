export enum TypeDemandeReport {
  DEMANDE_CANDIDAT = 'DEMANDE_CANDIDAT',
  PROPOSITION_INTERVENANT = 'PROPOSITION_INTERVENANT',
  REACTIVATION_APRES_ABSENCE = 'REACTIVATION_APRES_ABSENCE',
}

export enum DemandeReportStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTEE = 'ACCEPTEE',
  REFUSEE = 'REFUSEE',
}

export interface Reprogrammer {
  id?: string;
  interviewId: string;
  applicationId?: string;
  type: TypeDemandeReport;
  demandeurKeycloakId: string;
  cibleKeycloakId?: string;
  ancienneDate?: string;
  nouvelleDateProposee: string;
  motif: string;
  statut: DemandeReportStatus;
  commentaireTraitement?: string;
  traiteParKeycloakId?: string;
  dateCreation?: string;
  dateTraitement?: string;

  // Champs pratiques pour l'affichage, envoyés par le back
  candidateName?: string;
  posteRecrutement?: string;
  interviewerName?: string;
}

export interface DemanderReportPayload {
  nouvelleDateProposee: string; // ISO LocalDateTime, ex: "2026-09-01T10:00:00"
  motif: string;
}

export interface TraiterDemandeReportPayload {
  commentaire?: string;
}
