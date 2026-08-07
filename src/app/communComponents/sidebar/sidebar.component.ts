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
  styleUrls: ['./sidebar.component.css'],
})
export class SideBarComponent implements OnInit, OnDestroy {
  openSubmenus: Record<string, boolean> = {
    postes: false, 
    employees: false, 
    candidat: false,
  };

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) {
      this.openSubmenus = { postes: false, employees: false, candidat: false }; 
    }
  }

  isCollapsed = false;
  isLoggedIn = false;
  user: UserConnected | null = null;
  notifCount = 0;
  wsStatus: ConnectionStatus = 'DISCONNECTED';

  readonly profileRoute = '/getMyprofile';
  readonly dashboardRoute = ROLE_ROUTES;
  currentRole: keyof typeof ROLE_ROUTES = 'EMPLOYEE';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly wsService: WebSocketService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.syncAuth();
    this.loadUserProfile();
    this.connectRealtime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  private syncAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.user = this.authService.getCurrentUser();
  }

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

          if (
            this.user?.role &&
            ROLE_ROUTES[this.user.role as keyof typeof ROLE_ROUTES]
          ) {
            this.currentRole = this.user.role as keyof typeof ROLE_ROUTES;
          }
        },
        error: () => {},
      });
  }

  private connectRealtime(): void {
    if (!this.isLoggedIn) return;

    const token = this.authService.getToken() ?? undefined;
    this.wsService.connect(token);

    this.wsService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => (this.wsStatus = status));

    this.wsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: AdminRealtimeEvent) => {
        if (event.type !== 'STATS_UPDATE') this.notifCount++;
      });
  }

  clearNotifCount(): void {
    this.notifCount = 0;
  }

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
      if (k !== key) this.openSubmenus[k] = false;
    });
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
