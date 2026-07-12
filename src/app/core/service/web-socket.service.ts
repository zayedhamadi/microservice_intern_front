import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../environement/environment';
import { StatsPayload } from '../models/userstatistics';
import { AdminRealtimeEvent, ConnectionStatus } from '../models/websocket';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  readonly stats$ = new Subject<StatsPayload>();
  readonly events$ = new Subject<AdminRealtimeEvent>();
  readonly status$ = new BehaviorSubject<ConnectionStatus>('DISCONNECTED');

  private client!: Client;
  private subscriptions: StompSubscription[] = [];
  private reconnectAttempts = 0;

  /** Backend WS pas encore implémenté → on plafonne les tentatives pour ne pas spammer. */
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  private readonly WS_URL =
    environment.apiUrl
      .replace('/api', '')
      .replace('http://', 'ws://')
      .replace('https://', 'wss://') + '/ws-admin';

  connect(jwtToken?: string): void {
    if (this.client?.active) return;

    this.status$.next('CONNECTING');

    this.client = new Client({
      brokerURL: this.WS_URL,
      connectHeaders: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {},

      // stompjs applique ce délai fixe à chaque tentative ; l'arrêt définitif
      // est géré nous-mêmes via handleFailedAttempt() ci-dessous.
      reconnectDelay: 3000,
      heartbeatIncoming: 25_000,
      heartbeatOutgoing: 25_000,

      onConnect: () => {
        this.reconnectAttempts = 0;
        this.status$.next('CONNECTED');
        this.subscribeToTopics();
        console.log('[WS-SupraTech] Connected →', this.WS_URL);
      },

      onDisconnect: () => {
        this.status$.next('DISCONNECTED');
        this.subscriptions = [];
        console.log('[WS-SupraTech] Disconnected');
      },

      onStompError: (frame) => {
        this.status$.next('ERROR');
        console.error('[WS-SupraTech] STOMP Error:', frame.headers['message']);
        this.handleFailedAttempt();
      },

      onWebSocketError: (error) => {
        this.status$.next('ERROR');
        console.error('[WS-SupraTech] WebSocket Error:', error);
        this.handleFailedAttempt();
      },
    });

    this.client.activate();
  }

  /** Stoppe les tentatives une fois le plafond atteint (backend indisponible). */
  private handleFailedAttempt(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn(
        `[WS-SupraTech] ${this.MAX_RECONNECT_ATTEMPTS} tentatives échouées — arrêt automatique.`,
      );
      this.disconnect();
    }
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
          console.log('[WS-SupraTech] Event:', event.type, event.payload);
        } catch (e) {
          console.error('[WS-SupraTech] Event parse error', e);
        }
      },
    );

    this.subscriptions.push(statsSub, eventsSub);
  }

  /** Permet à un composant de relancer manuellement après un arrêt automatique. */
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
