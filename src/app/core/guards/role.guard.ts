
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: string[] = route.data?.['roles'] ?? [];

  if (expectedRoles.length === 0) {
    return true;
  }

  const userRole = authService.getRole();

  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
