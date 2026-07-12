import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/service/auth.service';
import { UserService } from '../../core/service/user.service';
import { WebSocketService } from '../../core/service/web-socket.service';
import { UserConnected } from '../../core/models/userConnected';
import {
  AdminRealtimeEvent,
  ConnectionStatus,
} from '../../core/models/websocket';
import {
  eventColor,
  eventIcon,
  wsStatusClass,
  wsStatusLabel,
} from '../../core/helpers/websocket.helpers';
import { ROLE_ROUTES } from '../../core/constant/role-route';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SideBarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isLoggedIn = false;
  user: UserConnected | null = null;

  notifCount = 0;
  wsStatus: ConnectionStatus = 'DISCONNECTED';

  openSubmenus: Record<string, boolean> = {};
  private readonly destroy$ = new Subject<void>();

  readonly profileRoute = '/getMyprofile';
  readonly dashboardRoute = ROLE_ROUTES;
  currentRole: keyof typeof ROLE_ROUTES = 'EMPLOYEE'; // Default fallback

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly wsService: WebSocketService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.syncAuth();

    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.user = {
            ...(this.user as UserConnected),
            ...p,
            image: p.imageBase64,
          } as UserConnected;

          // Set currentRole based on the user's role
          if (
            this.user?.role &&
            ROLE_ROUTES[this.user.role as keyof typeof ROLE_ROUTES]
          ) {
            this.currentRole = this.user.role as keyof typeof ROLE_ROUTES;
          }
        },
        error: () => {},
      });

    this.connectRealtime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────

  private syncAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.user = this.authService.getCurrentUser();
  }

  // ─────────────────────────────────────────────
  // TEMPS RÉEL — Notifications
  // ─────────────────────────────────────────────

  private connectRealtime(): void {
    if (!this.isLoggedIn) return;

    const token = this.authService.getToken() ?? undefined;
    this.wsService.connect(token);

    this.wsService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s) => (this.wsStatus = s));

    this.wsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: AdminRealtimeEvent) => {
        if (event.type !== 'STATS_UPDATE') this.notifCount++;
      });
  }

  clearNotifCount(): void {
    this.notifCount = 0;
  }

  // ─────────────────────────────────────────────
  // WEBSOCKET HELPERS (template)
  // ─────────────────────────────────────────────

  get wsStatusLabel(): string {
    return wsStatusLabel(this.wsStatus);
  }

  get wsStatusClass(): string {
    return wsStatusClass(this.wsStatus);
  }

  eventIcon(type?: string): string {
    return eventIcon(type as any);
  }

  eventColor(type?: string): string {
    return eventColor(type as any);
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.openSubmenus = {};
  }

  toggleSubmenu(key: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isCollapsed) {
      this.isCollapsed = false;
      setTimeout(() => (this.openSubmenus[key] = true), 300);
      return;
    }
    this.openSubmenus[key] = !this.openSubmenus[key];
  }

  isSubmenuOpen(key: string): boolean {
    return !!this.openSubmenus[key];
  }

  getAvatarSrc(): string | null {
    const img = this.user?.image;
    if (!img) return null;
    return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
  }

  logout(): void {
    this.authService.logout();
    this.wsService.disconnect();
  }
}
