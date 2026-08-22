import {
  InterviewResult,
  InterviewMode,
  InterviewStatus,
  InterviewSource,
  InterviewType,
} from './enums/enumPosteRecrutemnt';

export interface Interview {
  id?: string;
  source?: InterviewSource;
  applicationId?: string;
  candidatKeycloakId?: string;
  candidateName: string;
  candidateEmail?: string;
  posteRecrutement: string;
  posteId?: string;
  recruteurKeycloakId?: string;
  interviewerName: string;
  type?: InterviewType;
  interviewDate: string; // 'yyyy-MM-dd'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  mode: InterviewMode;
  location?: string;
  meetingLink?: string;
  status: InterviewStatus;
  resultat?: InterviewResult;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanificationCandidatureContext {
  applicationId: string;
  candidateName: string;
  candidateEmail?: string;
  posteRecrutement: string;
  typeEntretien: 'rh-initial' | 'technique' | 'rh-final';
}

export interface InterviewDialogData {
  interview?: Interview;
  selectedDate?: string;
  planificationCandidature?: PlanificationCandidatureContext;
}

export interface InterviewPage {
  content: Interview[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface InterviewStats {
  status: string;
  count: number;
}
