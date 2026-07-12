export type EventType =
  | 'STATS_UPDATE'
  | 'NEW_USER'
  | 'CESSATION'
  | 'REACTIVATION'
  | 'LOGIN_ACTIVITY'
  | 'CERTIFICATION'
  | 'DEMANDE_CONGE';

export type ConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR';

export interface AdminRealtimeEvent {
  type: EventType;
  payload: any;
  timestamp: string;
}
