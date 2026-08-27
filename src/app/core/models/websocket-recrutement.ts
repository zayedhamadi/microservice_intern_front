export type RecrutementEventType =
  | 'NEW_POSTE'
  | 'POSTE_STATUS_CHANGED'
  | 'NEW_APPLICATION'
  | 'APPLICATION_STATUS_CHANGED'
  | 'INTERVIEW_PLANIFIE'
  | 'INTERVIEW_REPORTE'
  | 'INTERVIEW_ANNULE'
  | 'INTERVIEW_ABSENT'
  | 'INTERVIEW_RESULTAT'
  | 'REPROGRAMMATION_DEMANDEE'
  | 'REPROGRAMMATION_TRAITEE';

export interface RecrutementRealtimeEvent {
  type: RecrutementEventType;
  payload: any;
  timestamp: string;
}

export interface PosteEventPayload {
  idPoste: string;
  titre: string;
  departementNom: string;
  ancienStatus: string | null;
  nouveauStatus: string;
}

export interface ApplicationEventPayload {
  applicationId: string;
  candidatKeycloakId: string;
  candidateName: string;
  posteId: string;
  posteTitre: string | null;
  ancienStatut: string | null;
  nouveauStatut: string;
  commentaireRH: string | null;
}

export interface InterviewEventPayload {
  interviewId: string;
  applicationId: string | null;
  candidatKeycloakId: string | null;
  candidateName: string | null;
  source: string;
  type: string | null;
  dateEntretien: string | null;
  mode: string | null;
  lieu: string | null;
  lienVisio: string | null;
  statut: string;
  resultat: string | null;
  notes: string | null;
}

export interface ReprogrammationEventPayload {
  reprogrammerId: string;
  interviewId: string;
  applicationId: string | null;
  type: string;
  demandeurKeycloakId: string;
  cibleKeycloakId: string | null;
  nouvelleDateProposee: string;
  motif: string;
  statut: string;
}

export interface RecrutementNotificationItem {
  id: string;
  type: RecrutementEventType;
  text: string;
  time: string;
  color: string;
  icon: string;
  read: boolean;
}

export const RECRUTEMENT_EVENT_ICONS: Record<RecrutementEventType, string> = {
  NEW_POSTE: 'fa-briefcase',
  POSTE_STATUS_CHANGED: 'fa-briefcase',
  NEW_APPLICATION: 'fa-file-circle-plus',
  APPLICATION_STATUS_CHANGED: 'fa-arrow-right-arrow-left',
  INTERVIEW_PLANIFIE: 'fa-calendar-check',
  INTERVIEW_REPORTE: 'fa-calendar-days',
  INTERVIEW_ANNULE: 'fa-calendar-xmark',
  INTERVIEW_ABSENT: 'fa-user-xmark',
  INTERVIEW_RESULTAT: 'fa-clipboard-check',
  REPROGRAMMATION_DEMANDEE: 'fa-clock-rotate-left',
  REPROGRAMMATION_TRAITEE: 'fa-check-double',
};

export const RECRUTEMENT_EVENT_COLORS: Record<RecrutementEventType, string> = {
  NEW_POSTE: '#6366f1',
  POSTE_STATUS_CHANGED: '#0ea5e9',
  NEW_APPLICATION: '#1D9E75',
  APPLICATION_STATUS_CHANGED: '#4a6cf7',
  INTERVIEW_PLANIFIE: '#10b981',
  INTERVIEW_REPORTE: '#f59e0b',
  INTERVIEW_ANNULE: '#ef4444',
  INTERVIEW_ABSENT: '#ef4444',
  INTERVIEW_RESULTAT: '#8b5cf6',
  REPROGRAMMATION_DEMANDEE: '#f97316',
  REPROGRAMMATION_TRAITEE: '#0891b2',
};

export function recrutementEventIcon(type?: RecrutementEventType): string {
  return type ? (RECRUTEMENT_EVENT_ICONS[type] ?? 'fa-bell') : 'fa-bell';
}

export function recrutementEventColor(type?: RecrutementEventType): string {
  return type ? (RECRUTEMENT_EVENT_COLORS[type] ?? '#64748b') : '#64748b';
}

function libelleType(type: string | null): string {
  switch (type) {
    case 'RH_INITIAL':
      return 'RH initial';
    case 'TECHNIQUE':
      return 'technique';
    case 'RH_FINAL':
      return 'RH final';
    default:
      return 'libre';
  }
}

export function buildRecrutementNotificationText(
  event: RecrutementRealtimeEvent,
): string {
  switch (event.type) {
    case 'NEW_POSTE': {
      const p = event.payload as PosteEventPayload;
      return `Nouveau poste : ${p?.titre ?? ''}`;
    }
    case 'POSTE_STATUS_CHANGED': {
      const p = event.payload as PosteEventPayload;
      return `Poste "${p?.titre ?? ''}" : ${p?.ancienStatus ?? '?'} → ${p?.nouveauStatus ?? ''}`;
    }
    case 'NEW_APPLICATION': {
      const p = event.payload as ApplicationEventPayload;
      return `Nouvelle candidature : ${p?.candidateName ?? ''} sur ${p?.posteTitre ?? ''}`;
    }
    case 'APPLICATION_STATUS_CHANGED': {
      const p = event.payload as ApplicationEventPayload;
      return `Candidature ${p?.candidateName ?? ''} : ${p?.ancienStatut ?? '?'} → ${p?.nouveauStatut ?? ''}`;
    }
    case 'INTERVIEW_PLANIFIE': {
      const p = event.payload as InterviewEventPayload;
      return `Entretien ${libelleType(p?.type)} planifié : ${p?.candidateName ?? ''}`;
    }
    case 'INTERVIEW_REPORTE': {
      const p = event.payload as InterviewEventPayload;
      return `Entretien ${libelleType(p?.type)} reporté : ${p?.candidateName ?? ''}`;
    }
    case 'INTERVIEW_ANNULE': {
      const p = event.payload as InterviewEventPayload;
      return `Entretien ${libelleType(p?.type)} annulé : ${p?.candidateName ?? ''}`;
    }
    case 'INTERVIEW_ABSENT': {
      const p = event.payload as InterviewEventPayload;
      return `Candidat absent : ${p?.candidateName ?? ''}`;
    }
    case 'INTERVIEW_RESULTAT': {
      const p = event.payload as InterviewEventPayload;
      return `Résultat entretien ${libelleType(p?.type)} : ${p?.resultat ?? ''} (${p?.candidateName ?? ''})`;
    }
    case 'REPROGRAMMATION_DEMANDEE': {
      const p = event.payload as ReprogrammationEventPayload;
      return `Demande de report reçue : ${p?.motif ?? ''}`;
    }
    case 'REPROGRAMMATION_TRAITEE': {
      const p = event.payload as ReprogrammationEventPayload;
      return `Demande de report ${p?.statut === 'ACCEPTEE' ? 'acceptée' : 'refusée'}`;
    }
    default:
      return 'Nouvel événement recrutement';
  }
}
