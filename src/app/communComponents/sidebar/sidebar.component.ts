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
} from '../../core/helpers/websocket.helpers';

import { ROLE_ROUTES, CALENDAR_ROUTES } from '../../core/constant/role-route';

type SubmenuKey = 'postes' | 'employees' | 'recrutement' | 'candidat';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SideBarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isMobileOpen = false;

  openSubmenus: Record<SubmenuKey, boolean> = {
    postes: false,
    employees: false,
    recrutement: false,
    candidat: false,
  };

  isLoggedIn = false;
  user: UserConnected | null = null;

  notifCount = 0;

  wsStatus: ConnectionStatus = 'DISCONNECTED';

  readonly profileRoute = '/getMyprofile';

  readonly dashboardRoute = ROLE_ROUTES;

  readonly calendarRoute = CALENDAR_ROUTES;

  readonly reprogrammationRoutes = {
    RH: '/rh/demandes-reprogrammation',
    EMPLOYEE: '/manager/demandes-reprogrammation',
    ADMIN: '',
    CANDIDAT: '',
  } as const;

  currentRole: keyof typeof ROLE_ROUTES = 'EMPLOYEE';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly wsService: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.syncAuthentication();
    this.loadUserProfile();
    this.connectRealtime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.wsService.disconnect();
  }

  private syncAuthentication(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.user = this.authService.getCurrentUser();

    this.updateCurrentRole();
  }

  private loadUserProfile(): void {
    if (!this.isLoggedIn) {
      return;
    }

    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.user = {
            ...(this.user ?? {}),
            ...profile,
            image: profile.imageBase64,
          } as UserConnected;

          this.updateCurrentRole();
        },

        error: (error) => {
          console.error(
            'Erreur lors du chargement du profil utilisateur :',
            error,
          );
        },
      });
  }

  private updateCurrentRole(): void {
    const role = this.user?.role;

    if (role && role in ROLE_ROUTES) {
      this.currentRole = role as keyof typeof ROLE_ROUTES;
    }
  }

  getDashboardRoute(): string {
    return this.dashboardRoute[this.currentRole];
  }

  getCalendarRoute(): string {
    return this.calendarRoute[this.currentRole];
  }

  getReprogrammationRoute(): string {
    if (this.user?.role === 'RH') {
      return this.reprogrammationRoutes.RH;
    }

    if (this.user?.role === 'EMPLOYEE') {
      return this.reprogrammationRoutes.EMPLOYEE;
    }

    return '';
  }

  private connectRealtime(): void {
    if (!this.isLoggedIn) {
      return;
    }

    const token = this.authService.getToken() ?? undefined;

    this.wsService.connect(token);

    this.wsService.status$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (status) => {
        this.wsStatus = status;
      },

      error: (error) => {
        console.error('Erreur du statut WebSocket :', error);
      },
    });

    this.wsService.events$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (event: AdminRealtimeEvent) => {
        if (event.type !== 'STATS_UPDATE') {
          this.notifCount++;
        }
      },

      error: (error) => {
        console.error(
          'Erreur lors de la réception de l’événement WebSocket :',
          error,
        );
      },
    });
  }

  clearNotifCount(): void {
    this.notifCount = 0;
  }

  getNotificationLabel(): string {
    if (this.notifCount > 99) {
      return '99+';
    }

    return this.notifCount.toString();
  }

  get wsStatusLabel(): string {
    switch (this.wsStatus) {
      case 'CONNECTED':
        return 'Temps réel actif';

      case 'CONNECTING':
        return 'Connexion...';

      case 'ERROR':
        return 'Connexion interrompue';

      default:
        return 'Hors ligne';
    }
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

  getFullName(): string {
    const firstName = this.user?.prenom ?? '';
    const lastName = this.user?.nom ?? '';

    return `${firstName} ${lastName}`.trim() || 'Utilisateur';
  }

  getUserRoleLabel(): string {
    switch (this.user?.role) {
      case 'RH':
        return 'Ressources humaines';

      case 'EMPLOYEE':
        return 'Employé';

      case 'CANDIDAT':
        return 'Candidat';

      case 'ADMIN':
        return 'Administrateur';

      default:
        return this.user?.role ?? 'Utilisateur';
    }
  }

  getAvatarSrc(): string | null {
    const image = this.user?.image;

    if (!image) {
      return null;
    }

    if (image.startsWith('data:')) {
      return image;
    }

    return `data:image/jpeg;base64,${image}`;
  }

  getUserInitials(): string {
    const firstName = this.user?.prenom?.charAt(0) ?? '';

    const lastName = this.user?.nom?.charAt(0) ?? '';

    const initials = `${firstName}${lastName}`.trim();

    return initials ? initials.toUpperCase() : 'U';
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      this.closeAllSubmenus();
    }
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileOpen = false;
  }

  toggleSubmenu(key: SubmenuKey, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isCollapsed) {
      this.isCollapsed = false;

      setTimeout(() => {
        this.openSubmenus[key] = true;
      }, 250);

      return;
    }

    Object.keys(this.openSubmenus).forEach((submenu) => {
      const submenuKey = submenu as SubmenuKey;

      if (submenuKey !== key) {
        this.openSubmenus[submenuKey] = false;
      }
    });

    this.openSubmenus[key] = !this.openSubmenus[key];
  }

  isSubmenuOpen(key: SubmenuKey): boolean {
    return this.openSubmenus[key];
  }

  private closeAllSubmenus(): void {
    this.openSubmenus = {
      postes: false,
      employees: false,
      recrutement: false,
      candidat: false,
    };
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }
}
