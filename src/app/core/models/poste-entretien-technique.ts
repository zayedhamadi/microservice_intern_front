  // core/models/poste-entretien-technique.ts
  import {
    InterviewMode,
    InterviewStatus,
    InterviewResult,
  } from './enums/enumPosteRecrutemnt';

  export interface CandidatEntretienTechnique {
    interviewId?: string; // absent tant que l'employé n'a pas encore planifié
    applicationId: string;
    candidatKeycloakId: string;
    candidateName: string;
    candidateEmail: string;
    interviewDate?: string;
    startTime?: string;
    endTime?: string;
    mode?: InterviewMode;
    location?: string;
    meetingLink?: string;
    status?: InterviewStatus;
    resultat?: InterviewResult;
    notes?: string;
    interviewerName?: string;
  }

  export interface PosteEntretiensTechniques {
    posteId: string;
    posteTitre: string;
    departementNom?: string;
    nombreCandidats: number;
    candidats: CandidatEntretienTechnique[];
  }
