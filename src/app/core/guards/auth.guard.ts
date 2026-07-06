import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ROLE_ROUTES } from '../constant/role-route';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/signin']);
      return false;
    }

    const expectedRoles: string[] = route.data?.['roles'] ?? [];

    if (expectedRoles.length === 0) {
      return true;
    }

    const user = this.authService.getUserInfo();
    const userRole = user?.role;

    if (!userRole || !expectedRoles.includes(userRole)) {
      this.redirectByRole(userRole);
      return false;
    }

    return true;
  }

  private redirectByRole(userRole: string | undefined): void {
    if (userRole && ROLE_ROUTES[userRole]) {
      this.router.navigate([ROLE_ROUTES[userRole]]);
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }
}
