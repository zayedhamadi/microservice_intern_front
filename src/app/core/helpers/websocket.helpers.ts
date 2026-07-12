import { EventType, ConnectionStatus } from '../models/websocket';

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  CONNECTING: '⏳ Connexion…',
  CONNECTED: '🟢 Temps réel',
  DISCONNECTED: '🔴 Hors ligne',
  ERROR: '⚠️ Erreur WS',
};

const STATUS_CLASSES: Record<ConnectionStatus, string> = {
  CONNECTING: 'ws-connecting',
  CONNECTED: 'ws-connected',
  DISCONNECTED: 'ws-disconnected',
  ERROR: 'ws-error',
};

const EVENT_ICONS: Record<EventType, string> = {
  NEW_USER: 'fa-user-plus',
  CESSATION: 'fa-user-slash',
  REACTIVATION: 'fa-user-check',
  STATS_UPDATE: 'fa-chart-line',
  LOGIN_ACTIVITY: 'fa-right-to-bracket',
  CERTIFICATION: 'fa-certificate',
  DEMANDE_CONGE: 'fa-calendar-days',
};

const EVENT_COLORS: Record<EventType, string> = {
  NEW_USER: '#1D9E75',
  CESSATION: '#ef4444',
  REACTIVATION: '#4a6cf7',
  STATS_UPDATE: '#64748b',
  LOGIN_ACTIVITY: '#f59e0b',
  CERTIFICATION: '#8b5cf6',
  DEMANDE_CONGE: '#0891b2',
};

export function wsStatusLabel(status: ConnectionStatus): string {
  return STATUS_LABELS[status];
}

export function wsStatusClass(status: ConnectionStatus): string {
  return STATUS_CLASSES[status];
}

export function eventIcon(type?: EventType): string {
  return type ? (EVENT_ICONS[type] ?? 'fa-bell') : 'fa-bell';
}

export function eventColor(type?: EventType): string {
  return type ? (EVENT_COLORS[type] ?? '#64748b') : '#64748b';
}
