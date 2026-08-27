import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../environement/environment';
import {
  RecrutementRealtimeEvent,
  RECRUTEMENT_EVENT_COLORS,
  RECRUTEMENT_EVENT_ICONS,
  RecrutementEventType,
} from '../models/websocket-recrutement';
import {
  ConnectionStatus,
  STATUS_CLASSES,
  STATUS_LABELS,
} from '../models/websocket';

export type RecrutementWsRole = 'RH' | 'EMPLOYEE' | 'CANDIDAT';

@Injectable({ providedIn: 'root' })
export class RecrutementWebSocketService implements OnDestroy {
  readonly events$ = new Subject<RecrutementRealtimeEvent>();
  readonly status$ = new BehaviorSubject<ConnectionStatus>('DISCONNECTED');

  private client!: Client;
  private subscriptions: StompSubscription[] = [];
  private reconnectAttempts = 0;
  private currentRole?: RecrutementWsRole;
  private currentKeycloakId?: string;

  private readonly WS_URL = `ws://localhost:${environment.EMPLOYEE_PORT}/ws-recrutement`;

  connect(
    jwtToken?: string,
    role?: RecrutementWsRole,
    keycloakId?: string,
  ): void {
    if (this.client?.active) {
      if (role !== this.currentRole || keycloakId !== this.currentKeycloakId) {
        this.currentRole = role;
        this.currentKeycloakId = keycloakId;
        this.subscriptions.forEach((s) => s.unsubscribe());
        this.subscriptions = [];
        this.subscribeToTopics(this.currentRole, this.currentKeycloakId);
      }
      return;
    }

    this.currentRole = role;
    this.currentKeycloakId = keycloakId;
    this.status$.next('CONNECTING');

    this.client = new Client({
      brokerURL: this.WS_URL,
      connectHeaders: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {},
      reconnectDelay: Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        30_000,
      ),
      heartbeatIncoming: 25_000,
      heartbeatOutgoing: 25_000,

      onConnect: () => {
        this.reconnectAttempts = 0;
        this.status$.next('CONNECTED');
        this.subscribeToTopics(this.currentRole, this.currentKeycloakId);
      },

      onDisconnect: () => {
        this.status$.next('DISCONNECTED');
        this.subscriptions = [];
      },

      onStompError: (frame) => {
        this.status$.next('ERROR');
        this.reconnectAttempts++;
        console.error(
          '[WS-Recrutement] STOMP Error:',
          frame.headers['message'],
        );
      },

      onWebSocketError: (error) => {
        this.status$.next('ERROR');
        this.reconnectAttempts++;
        console.error('[WS-Recrutement] WebSocket Error:', error);
      },
    });

    this.client.activate();
  }

  private subscribeToTopics(
    role?: RecrutementWsRole,
    keycloakId?: string,
  ): void {
    const subscribeEvents = (topic: string) => {
      const sub = this.client.subscribe(topic, (msg: IMessage) => {
        try {
          const event = JSON.parse(msg.body) as RecrutementRealtimeEvent;
          this.events$.next(event);
        } catch (e) {
          console.error(`[WS-Recrutement] Event parse error (${topic})`, e);
        }
      });
      this.subscriptions.push(sub);
    };

    subscribeEvents('/topic/recrutement.all');

    if (keycloakId) {
      subscribeEvents(`/topic/recrutement.user.${keycloakId}`);
    }

    switch (role) {
      case 'RH':
        subscribeEvents('/topic/recrutement.rh');
        break;
      case 'EMPLOYEE':
        subscribeEvents('/topic/recrutement.employee');
        break;
      case 'CANDIDAT':
        break;
    }
  }

  resetAndReconnect(
    jwtToken?: string,
    role?: RecrutementWsRole,
    keycloakId?: string,
  ): void {
    this.reconnectAttempts = 0;
    this.connect(jwtToken, role, keycloakId);
  }

  disconnect(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    if (this.client?.active) this.client.deactivate();
    this.status$.next('DISCONNECTED');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

export function wsRecrutementStatusLabel(s: ConnectionStatus): string {
  return STATUS_LABELS[s];
}

export function wsRecrutementStatusClass(s: ConnectionStatus): string {
  return STATUS_CLASSES[s];
}

export function recrutementEventIconFn(
  type?: RecrutementEventType | string,
): string {
  return type
    ? (RECRUTEMENT_EVENT_ICONS[type as RecrutementEventType] ?? 'fa-bell')
    : 'fa-bell';
}

export function recrutementEventColorFn(
  type?: RecrutementEventType | string,
): string {
  return type
    ? (RECRUTEMENT_EVENT_COLORS[type as RecrutementEventType] ?? '#64748b')
    : '#64748b';
}
