import {
  ApplicationStatus,
  InterviewMode,
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from './enums/enumPosteRecrutemnt';

export interface ResultatEntretienDto {
  resultat: InterviewResult;
  notes?: string;
}

export interface ChangerStatutDto {
  nouveauStatut: ApplicationStatus;
  commentaireRH?: string;
}

export interface PlanifierEntretienDto {
  dateEntretien?: string;
  mode: InterviewMode;
  lieu?: string;
  lienVisio?: string;
}

export interface InterviewDto {
  idInterview?: string;
  applicationId?: string;
  type: InterviewType;
  dateEntretien?: string;
  lieu?: string;
  lienVisio?: string;
  notes?: string;
  statut: InterviewStatus;
  resultat: InterviewResult;
  dateCreation?: string;
  mode: InterviewMode;
  dateModification?: string;
}
