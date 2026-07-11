import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { HIDDEN_NAVBAR_ROUTES } from '../core/constant/layout-routes';
import { AuthService } from '../core/service/auth.service';
import { UserConnected } from '../core/models/userConnected';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: UserConnected | null = null;

  showDropdown = false;
  activeRoute = '';
  hideNavbar = false;

  // Route unique du profil commun, peu importe le rôle
  readonly profileRoute = '/getMyprofile';

  private routerSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
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

    this.authSub = this.authService
      .isLoggedInObservable()
      .subscribe((logged) => {
        this.isLoggedIn = logged;
        if (!logged) {
          this.user = null;
        } else {
          this.syncAuth();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

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
  }

  logout(): void {
    this.authService.logout();
    this.user = null;
    this.showDropdown = false;
  }

  isActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }
}
