// core/models/websocket.ts
export type ConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR';

export type EventType =
  | 'STATS_UPDATE'
  | 'NEW_USER'
  | 'CESSATION'
  | 'REACTIVATION'
  | 'LOGIN_ACTIVITY'
  | 'CERTIFICATION'
  | 'DEMANDE_CONGE';

export interface AdminRealtimeEvent {
  type: EventType;
  payload: any;
  timestamp: string;
}

export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  CONNECTING: 'Connexion…',
  CONNECTED: 'Connecté',
  DISCONNECTED: 'Déconnecté',
  ERROR: 'Erreur',
};

export const STATUS_CLASSES: Record<ConnectionStatus, string> = {
  CONNECTING: 'ws-connecting',
  CONNECTED: 'ws-connected',
  DISCONNECTED: 'ws-disconnected',
  ERROR: 'ws-error',
};

export const EVENT_ICONS: Record<EventType, string> = {
  STATS_UPDATE: 'fa-chart-line',
  NEW_USER: 'fa-user-plus',
  CESSATION: 'fa-user-xmark',
  REACTIVATION: 'fa-user-check',
  LOGIN_ACTIVITY: 'fa-right-to-bracket',
  CERTIFICATION: 'fa-certificate',
  DEMANDE_CONGE: 'fa-calendar-days',
};

export const EVENT_COLORS: Record<EventType, string> = {
  STATS_UPDATE: '#4a6cf7',
  NEW_USER: '#1D9E75',
  CESSATION: '#ef4444',
  REACTIVATION: '#0ea5e9',
  LOGIN_ACTIVITY: '#8b5cf6',
  CERTIFICATION: '#f59e0b',
  DEMANDE_CONGE: '#f97316',
};
