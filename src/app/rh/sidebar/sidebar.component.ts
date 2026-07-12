import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UserCommonProfile } from '../../core/models/userConneccted';
import { AuthService } from '../../core/service/auth.service';
import { UserService } from '../../core/service/user.service';
import { WebSocketService } from '../../core/service/web-socket.service';
import {
  AdminRealtimeEvent,
  ConnectionStatus,
} from '../../core/models/websocket';
import {
  eventColor,
  eventIcon,
  wsStatusClass,
  wsStatusLabel,
} from '../../core/helpers/websocket.helpers'; // ✅ depuis les helpers, plus depuis le service

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SideBarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  profile: UserCommonProfile | null = null;
  userRole = '';
  notifCount = 0;
  wsStatus: ConnectionStatus = 'DISCONNECTED';

  openSubmenus: Record<string, boolean> = {};
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly wsService: WebSocketService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.profile = p;
          this.userRole = p.role ?? '';
        },
        error: () => (this.profile = null),
      });

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  // --- Sidebar UI ---

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

  clearNotifCount(): void {
    this.notifCount = 0;
  }

  // --- Websocket helpers exposés au template ---

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

  // --- Profil (un seul component partagé par les 3 rôles) ---

  getAvatarSrc(): string | null {
    const img = this.profile?.imageBase64;
    if (!img) return null;
    return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
  }

  logout(): void {
    this.authService.logout();
  }
}
