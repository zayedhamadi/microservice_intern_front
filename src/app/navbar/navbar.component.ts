import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { HIDDEN_NAVBAR_ROUTES } from '../core/constant/layout-routes';
import { AuthService } from '../core/service/auth.service';
import { UserConnected } from '../core/models/userConnected';
import { eventColor, eventIcon, WebSocketService } from '../core/service/web-socket.service';
import { NotificationItem, AdminRealtimeEvent, buildNotificationText } from '../core/models/websocket';
import { ROLE_ROUTES } from '../core/constant/role-route';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: UserConnected | null = null;

  showDropdown = false;
  showNotifDropdown = false;
  activeRoute = '';
  hideNavbar = false;

  readonly profileRoute = '/getMyprofile';
 
  getHomeRoute(): string {
  const role = this.user?.role;
  return role && ROLE_ROUTES[role] ? ROLE_ROUTES[role] : '/home';
}

  // --- Notifications temps réel ---
  notifications: NotificationItem[] = [];
  private readonly MAX_NOTIFICATIONS = 30;
  private readonly NOTIF_STORAGE_KEY = 'app_notifications';

  // Empêche un double abonnement à events$ si connectRealtime() est appelé plusieurs fois
  private realtimeInitialized = false;

  private routerSub?: Subscription;
  private authSub?: Subscription;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly wsService: WebSocketService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.syncAuth();
    this.updateVisibility(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects ?? e.url;
        this.activeRoute = url;
        this.updateVisibility(url);
        this.syncAuth();
      });

    // Ce seul abonnement suffit : le BehaviorSubject émet déjà l'état actuel
    // immédiatement à la souscription, donc pas besoin d'appeler connectRealtime()
    // une deuxième fois "à la main" ici.
    this.authSub = this.authService
      .isLoggedInObservable()
      .subscribe((logged) => {
        this.isLoggedIn = logged;
        if (!logged) {
          this.user = null;
          this.realtimeInitialized = false;
          this.wsService.disconnect();
        } else {
          this.syncAuth();
          this.connectRealtime();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────
  // TEMPS RÉEL — Notifications
  // ─────────────────────────────────────────────

  private connectRealtime(): void {
    const token = this.authService.getToken() ?? undefined;
    this.wsService.connect(token);

    // Garde-fou : même si connectRealtime() est rappelé, on ne s'abonne
    // qu'une seule fois à events$ pour éviter les doublons.
    if (this.realtimeInitialized) return;
    this.realtimeInitialized = true;

    this.wsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: AdminRealtimeEvent) => {
        if (event.type === 'STATS_UPDATE') return;
        this.addNotification(event);
      });
  }

  private addNotification(event: AdminRealtimeEvent): void {
    const item: NotificationItem = {
      id: `${event.type}-${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      type: event.type,
      text: buildNotificationText(event),
      time: this.formatTime(event.timestamp),
      color: eventColor(event.type),
      icon: eventIcon(event.type),
      read: false,
    };

    this.notifications.unshift(item);
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }
    this.persistNotifications();
  }

  get notifCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  toggleNotifDropdown(): void {
    this.showNotifDropdown = !this.showNotifDropdown;
    this.showDropdown = false;

    if (this.showNotifDropdown) {
      this.notifications.forEach((n) => (n.read = true));
      this.persistNotifications();
    }
  }

  closeNotifDropdown(): void {
    this.showNotifDropdown = false;
  }

  /** Supprime une seule notification (bouton individuel). */
  removeNotification(id: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.persistNotifications();
  }

  /** Supprime toutes les notifications (bouton "tout effacer"). */
  clearNotifications(): void {
    this.notifications = [];
    this.persistNotifications();
  }

  private loadNotifications(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.NOTIF_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as NotificationItem[];
      this.notifications = Array.isArray(parsed)
        ? parsed.slice(0, this.MAX_NOTIFICATIONS)
        : [];
    } catch {
      this.notifications = [];
    }
  }

  private persistNotifications(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(
        this.NOTIF_STORAGE_KEY,
        JSON.stringify(this.notifications),
      );
    } catch {
      // stockage plein ou indisponible : on ignore silencieusement
    }
  }

  private formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ─────────────────────────────────────────────
  // VISIBILITÉ / AUTH
  // ─────────────────────────────────────────────

  private updateVisibility(url: string): void {
    this.hideNavbar = HIDDEN_NAVBAR_ROUTES.some((r) => url.startsWith(r));
  }

  syncAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.user = null;
      return;
    }

    const localUser = this.authService.getCurrentUser();
    if (!localUser) return;

    this.user = localUser;

    this.authService.getMyProfile().subscribe({
      next: (profile: any) => {
        if (this.user) {
          this.user = { ...this.user, image: profile.imageBase64 || undefined };
        }
      },
      error: () => {},
    });
  }

  getAvatarSrc(): string | null {
    if (!this.user?.image) return null;
    if (this.user.image.startsWith('data:')) {
      return this.user.image;
    }
    return `data:image/jpeg;base64,${this.user.image}`;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    this.showNotifDropdown = false;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showDropdown = false;
    }
    if (!target.closest('.notif-wrap')) {
      this.showNotifDropdown = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.user = null;
    this.notifications = [];
    this.persistNotifications();
    this.realtimeInitialized = false;
    this.showDropdown = false;
    this.showNotifDropdown = false;
    this.wsService.disconnect();
  }

  isActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }
}
