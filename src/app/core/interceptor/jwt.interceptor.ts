import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private readonly publicUrls = [
    '/auth/register',
    '/auth/login',
    '/auth/google/url',
    'openid-connect',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/realms/',
    '/api/login-activity/logout',
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const isPublic = this.publicUrls.some((url) => request.url.includes(url));
    const token = this.authService.getToken();

    if (token && !isPublic) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isPublic) {
          // Ne jamais court-circuiter le flux OAuth en cours :
          // une requête tierce (navbar, notifs, etc.) peut prendre un 401
          // pendant les quelques secondes où /callback est en train de
          // sauvegarder les tokens. On laisse le callback gérer sa propre
          // redirection au lieu de clear+rediriger ici.
          if (this.authService.isAuthFlowInProgress()) {
            return throwError(() => error);
          }
          return this.handle401(request, next);
        }
        return throwError(() => error);
      }),
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private handle401(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((t): t is string => t !== null),
        take(1),
        switchMap((t) => next.handle(this.addToken(request, t))),
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshAccessToken().pipe(
      switchMap((tokenData: any) => {
        this.isRefreshing = false;
        this.authService.saveToken(tokenData.access_token);
        this.authService.saveRefreshToken(tokenData.refresh_token);
        this.refreshTokenSubject.next(tokenData.access_token);
        return next.handle(this.addToken(request, tokenData.access_token));
      }),
      catchError((err) => {
        this.isRefreshing = false;
        this.authService.clearTokens();
        this.router.navigate(['/signin']);
        return throwError(() => err);
      }),
    );
  }
}
