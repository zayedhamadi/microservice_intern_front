import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../environement/environment';
import { StatsPayload } from '../models/userstatistics';
import {
  AdminRealtimeEvent,
  STATUS_LABELS,
  ConnectionStatus,
  EVENT_COLORS,
  EVENT_ICONS,
  EventType,
  STATUS_CLASSES,
} from '../models/websocket';

@Injectable({ providedIn: 'root' })
export class WebSocketService  implements OnDestroy {
  readonly stats$ = new Subject<StatsPayload>();
  readonly events$ = new Subject<AdminRealtimeEvent>();
  readonly status$ = new BehaviorSubject<ConnectionStatus>('DISCONNECTED');

  private client!: Client;
  private subscriptions: StompSubscription[] = [];
  private reconnectAttempts = 0;

  // Connexion directe à user-service (le gateway ne route pas encore /ws-admin)
  private readonly WS_URL = `ws://localhost:${environment.EMPLOYEE_PORT}/ws-admin`;

  connect(jwtToken?: string): void {
    if (this.client?.active) return;

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
        this.subscribeToTopics();
      },

      onDisconnect: () => {
        this.status$.next('DISCONNECTED');
        this.subscriptions = [];
      },

      onStompError: (frame) => {
        this.status$.next('ERROR');
        this.reconnectAttempts++;
        console.error('[WS-SupraTech] STOMP Error:', frame.headers['message']);
      },

      onWebSocketError: (error) => {
        this.status$.next('ERROR');
        this.reconnectAttempts++;
        console.error('[WS-SupraTech] WebSocket Error:', error);
      },
    });

    this.client.activate();
  }

  private subscribeToTopics(): void {
    const statsSub = this.client.subscribe(
      '/topic/admin.stats',
      (msg: IMessage) => {
        try {
          const envelope = JSON.parse(msg.body) as AdminRealtimeEvent;
          this.stats$.next(envelope.payload as StatsPayload);
        } catch (e) {
          console.error('[WS-SupraTech] Stats parse error', e);
        }
      },
    );

    const eventsSub = this.client.subscribe(
      '/topic/admin.events',
      (msg: IMessage) => {
        try {
          const event = JSON.parse(msg.body) as AdminRealtimeEvent;
          this.events$.next(event);
        } catch (e) {
          console.error('[WS-SupraTech] Event parse error', e);
        }
      },
    );

    this.subscriptions.push(statsSub, eventsSub);
  }

  resetAndReconnect(jwtToken?: string): void {
    this.reconnectAttempts = 0;
    this.connect(jwtToken);
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

export function wsStatusLabel(s: ConnectionStatus): string {
  return STATUS_LABELS[s];
}

export function wsStatusClass(s: ConnectionStatus): string {
  return STATUS_CLASSES[s];
}

export function eventIcon(type?: EventType | string): string {
  return type ? (EVENT_ICONS[type as EventType] ?? 'fa-bell') : 'fa-bell';
}

export function eventColor(type?: EventType | string): string {
  return type ? (EVENT_COLORS[type as EventType] ?? '#64748b') : '#64748b';
}