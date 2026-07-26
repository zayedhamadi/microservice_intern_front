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

export type WsRole = 'RH' | 'EMPLOYEE' | 'CANDIDAT';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  readonly stats$ = new Subject<StatsPayload>();
  readonly events$ = new Subject<AdminRealtimeEvent>();
  readonly status$ = new BehaviorSubject<ConnectionStatus>('DISCONNECTED');

  private client!: Client;
  private subscriptions: StompSubscription[] = [];
  private reconnectAttempts = 0;
  private currentRole?: WsRole;

  private readonly WS_URL = `ws://localhost:${environment.EMPLOYEE_PORT}/ws-admin`;

  connect(jwtToken?: string, role?: WsRole): void {
    if (this.client?.active) {
      if (role !== this.currentRole) {
        this.currentRole = role;
        this.subscriptions.forEach((s) => s.unsubscribe());
        this.subscriptions = [];
        this.subscribeToTopics(this.currentRole);
      }
      return;
    }

    this.currentRole = role;
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
        this.subscribeToTopics(this.currentRole);
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

  private subscribeToTopics(role?: WsRole): void {
    const subscribeEvents = (topic: string) => {
      const sub = this.client.subscribe(topic, (msg: IMessage) => {
        try {
          const event = JSON.parse(msg.body) as AdminRealtimeEvent;
          this.events$.next(event);
        } catch (e) {
          console.error(`[WS-SupraTech] Event parse error (${topic})`, e);
        }
      });
      this.subscriptions.push(sub);
    };

    subscribeEvents('/topic/admin.events.all');

    switch (role) {
      case 'EMPLOYEE':
        subscribeEvents('/topic/admin.events.admin');
        this.subscriptions.push(
          this.client.subscribe('/topic/admin.stats', (msg: IMessage) => {
            try {
              const envelope = JSON.parse(msg.body) as AdminRealtimeEvent;
              this.stats$.next(envelope.payload as StatsPayload);
            } catch (e) {
              console.error('[WS-SupraTech] Stats parse error', e);
            }
          }),
        );
        subscribeEvents('/topic/admin.events.rh-employee');

        break;

      case 'RH':
        subscribeEvents('/topic/admin.events.rh');
        subscribeEvents('/topic/admin.events.rh-employee');
        break;

      case 'CANDIDAT':
        break;
    }
  }

  resetAndReconnect(jwtToken?: string, role?: WsRole): void {
    this.reconnectAttempts = 0;
    this.connect(jwtToken, role);
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
