import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';
import { environment } from '../environement/environment';
import { AuthService } from '../service/auth.service';


export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/signin']);
  }

  return http
    .get<{
      complete: boolean;
    }>(`${environment.apiUrl}/users/me/profile-complete`)
    .pipe(
      map((response) =>
        response.complete ? true : router.createUrlTree(['/complete-profile']),
      ),
      catchError((error) => {
        if (error?.status === 401) {
          return of(router.createUrlTree(['/signin']));
        }

        return of(true);
      }),
    );
};
