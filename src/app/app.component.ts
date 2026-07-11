import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { HIDDEN_NAVBAR_ROUTES } from './core/constant/layout-routes';
import { AuthService } from './core/service/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  showNavbar = true;
  title = 'frontend-microservice';
  private routerSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.updateNavbarVisibility(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.updateNavbarVisibility(e.urlAfterRedirects ?? e.url);
      });

    this.authSub = this.authService.isLoggedInObservable().subscribe(() => {
      this.updateNavbarVisibility(this.router.url);
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  private updateNavbarVisibility(url: string): void {
    const isHiddenRoute = HIDDEN_NAVBAR_ROUTES.some((r) => url.startsWith(r));

    this.showNavbar = !isHiddenRoute;
  }
}
