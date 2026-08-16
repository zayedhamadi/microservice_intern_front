export interface InterviewDialogData {
  interview?: Interview;
  selectedDate?: string;
}

export interface Interview {
  id?: string;
  candidateName: string;
  candidateEmail?: string;
  posteRecrutement: string;
  posteId?: string;
  interviewerName: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode: InterviewMode;
  location?: string;
  meetingLink?: string;
  status: InterviewStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewDialogData {
  interview?: Interview;
  selectedDate?: string;
}
export enum InterviewMode {
  PRESENTIEL = 'PRESENTIEL',
  DISTANCIEL = 'DISTANCIEL',
  TELEPHONIQUE = 'TELEPHONIQUE',
}
export enum InterviewStatus {
  PLANIFIE = 'PLANIFIE',
  CONFIRME = 'CONFIRME',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  REPORTE = 'REPORTE',
}
export interface Interview {
  id?: string;
  candidateName: string;
  candidateEmail?: string;
  posteRecrutement: string;
  posteId?: string;
  interviewerName: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode: InterviewMode;
  location?: string;
  meetingLink?: string;
  status: InterviewStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
