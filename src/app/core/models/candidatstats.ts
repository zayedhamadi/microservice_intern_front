// ==================== Enums (miroir des Enum backend) ====================

export type ApplicationStatus =
  | 'EN_ATTENTE'
  | 'SELECTIONNE'
  | 'EN_ENTRETIEN_RH'
  | 'EN_ENTRETIEN_TECHNIQUE'
  | 'EN_ENTRETIEN_FINAL'
  | 'ACCEPTE'
  | 'REJETE'
  | 'RETIRE';

export type InterviewType = 'RH_INITIAL' | 'TECHNIQUE' | 'RH_FINAL';

export type InterviewSource = 'LIBRE' | 'CANDIDATURE';

export type InterviewMode = 'PRESENTIEL' | 'DISTANCIEL' | 'TELEPHONIQUE';

export type InterviewStatus =
  | 'PLANIFIE'
  | 'CONFIRME'
  | 'EN_COURS'
  | 'TERMINE'
  | 'ANNULE'
  | 'REPORTE'
  | 'ABSENT';

export type InterviewResult = 'REUSSI' | 'ECHOUE';

export type TypeContrat =
  | 'CDI'
  | 'CDD'
  | 'FREELANCE'
  | 'ALTERNANCE'
  | 'CIVP'
  | 'STAGE';

export type WorkType = 'SUR_SITE' | 'HYBRIDE' | 'DISTANCE';

export type DemandeReportStatus = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

// ==================== DTOs ====================

export interface MonthDataDto {
  mois: number;
  total: number;
}

export interface UpcomingInterviewDto {
  idInterview: string;
  applicationId: string | null;
  posteRecrutement: string | null;
  posteId: string | null;
  type: InterviewType | null;
  source: InterviewSource;
  mode: InterviewMode | null;
  dateEntretien: string | null; // ISO LocalDateTime
  dateFinEntretien: string | null;
  statut: InterviewStatus;
  lieu: string | null;
  lienVisio: string | null;
  interviewerName: string | null;
}

export interface InterviewCandidateStatsDto {
  total: number;
  aVenir: number;
  dansLes7Jours: number;
  termines: number;
  reussis: number;
  tauxReussite: number;
  parStatut: Record<string, number>;
  prochains: UpcomingInterviewDto[];
}

export interface PosteCandidateItemDto {
  idPosteRecrutement: string;
  titre: string;
  departementNom: string | null;
  typeContrat: TypeContrat | null;
  workType: WorkType | null;
  lieu: string | null;
  salaire: number | null;
  nombrePostes: number | null;
  datePosteRecrutement: string | null; // ISO LocalDate
  dateExpirationPosteRecrutement: string | null;
}

export interface PosteCandidateStatsDto {
  totalOuverts: number;
  derniersPostes: PosteCandidateItemDto[];
}

export interface CertificationCandidateStatsDto {
  total: number;
}

export interface ApplicationCandidateStatsDto {
  total: number;
  parStatut: Record<string, number>;
  ceMois: number;
  acceptees: number;
  rejetees: number;
  enCours: number;
  retirees: number;
  tauxAcceptation: number;
  scoreMatchingMoyen: number | null;
  serieMensuelle: MonthDataDto[];
}

export interface ReprogrammerCandidateStatsDto {
  total: number;
  enAttente: number;
  acceptees: number;
  refusees: number;
  parStatut: Record<string, number>;
}

export interface CandidateDashboardStatsDto {
  candidatKeycloakId: string;
  applications: ApplicationCandidateStatsDto;
  interviews: InterviewCandidateStatsDto;
  postes: PosteCandidateStatsDto;
  certifications: CertificationCandidateStatsDto;
  reprogrammations: ReprogrammerCandidateStatsDto;
  genereLe: string; 
}
