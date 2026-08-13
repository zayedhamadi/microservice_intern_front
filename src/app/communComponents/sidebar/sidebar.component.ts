import { Component, OnDestroy, OnInit } from '@angular/core';

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

import { ROLE_ROUTES, CALENDAR_ROUTES } from '../../core/constant/role-route';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SideBarComponent implements OnInit, OnDestroy {
  // =========================
  // SIDEBAR
  // =========================

  isCollapsed = false;

  openSubmenus: Record<string, boolean> = {
    postes: false,
    employees: false,
    candidat: false,
  };

  // =========================
  // AUTH
  // =========================

  isLoggedIn = false;

  user: UserConnected | null = null;

  // =========================
  // NOTIFICATIONS
  // =========================

  notifCount = 0;

  // =========================
  // WEBSOCKET
  // =========================

  wsStatus: ConnectionStatus = 'DISCONNECTED';

  // =========================
  // ROUTES
  // =========================

  readonly profileRoute = '/getMyprofile';

  readonly dashboardRoute = ROLE_ROUTES;

  readonly calendarRoute = CALENDAR_ROUTES;

  currentRole: keyof typeof ROLE_ROUTES = 'EMPLOYEE';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly wsService: WebSocketService,
  ) {}

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {
    this.syncAuth();

    this.loadUserProfile();

    this.connectRealtime();
  }

  // =========================
  // DESTROY
  // =========================

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();

    this.wsService.disconnect();
  }

  // =========================
  // AUTH
  // =========================

  private syncAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.user = this.authService.getCurrentUser();

    this.updateCurrentRole();
  }

  // =========================
  // USER PROFILE
  // =========================

  private loadUserProfile(): void {
    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.user = {
            ...(this.user as UserConnected),
            ...profile,
            image: profile.imageBase64,
          } as UserConnected;

          this.updateCurrentRole();
        },

        error: (error) => {
          console.error('Erreur lors du chargement du profil :', error);
        },
      });
  }

  // =========================
  // ROLE
  // =========================

  private updateCurrentRole(): void {
    const role = this.user?.role;

    if (role && role in ROLE_ROUTES) {
      this.currentRole = role as keyof typeof ROLE_ROUTES;
    }
  }

  // =========================
  // DASHBOARD ROUTE
  // =========================

  getDashboardRoute(): string {
    return this.dashboardRoute[this.currentRole];
  }

  // =========================
  // CALENDAR ROUTE
  // =========================

  getCalendarRoute(): string {
    return this.calendarRoute[this.currentRole];
  }

  // =========================
  // WEBSOCKET
  // =========================

  private connectRealtime(): void {
    if (!this.isLoggedIn) {
      return;
    }

    const token = this.authService.getToken() ?? undefined;

    this.wsService.connect(token);

    this.wsService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.wsStatus = status;
      });

    this.wsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: AdminRealtimeEvent) => {
        if (event.type !== 'STATS_UPDATE') {
          this.notifCount++;
        }
      });
  }

  // =========================
  // NOTIFICATIONS
  // =========================

  clearNotifCount(): void {
    this.notifCount = 0;
  }

  // =========================
  // WEBSOCKET STATUS
  // =========================

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

  // =========================
  // SIDEBAR COLLAPSE
  // =========================

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      this.openSubmenus = {
        postes: false,
        employees: false,
        candidat: false,
      };
    }
  }

  // =========================
  // SUBMENUS
  // =========================

  toggleSubmenu(key: string, event?: Event): void {
    if (event) {
      event.preventDefault();

      event.stopPropagation();
    }

    if (this.isCollapsed) {
      this.isCollapsed = false;

      setTimeout(() => {
        this.openSubmenus[key] = true;
      }, 300);

      return;
    }

    Object.keys(this.openSubmenus).forEach((k) => {
      if (k !== key) {
        this.openSubmenus[k] = false;
      }
    });

    this.openSubmenus[key] = !this.openSubmenus[key];
  }

  isSubmenuOpen(key: string): boolean {
    return !!this.openSubmenus[key];
  }

  // =========================
  // AVATAR
  // =========================

  getAvatarSrc(): string | null {
    const img = this.user?.image;

    if (!img) {
      return null;
    }

    return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
  }

  // =========================
  // LOGOUT
  // =========================

  logout(): void {
    this.authService.logout();

    this.wsService.disconnect();
  }
}
