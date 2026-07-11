import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  catchError,
  of,
  Observable,
  throwError,
  timer,
  retry,
  BehaviorSubject,
} from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../environement/environment';
import {
  RegisterRequest,
  AuthResponse,
  LoginRequest,
  CompleteProfileRequest,
} from '../models/user';
import { UserSession } from '../models/userSession';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly keycloakUrl = environment.keycloak.url;
  private readonly clientId = environment.keycloak.clientId;
  private readonly clientSecret = environment.keycloak.clientSecret;
  private readonly redirectUri = environment.keycloak.redirectUri;
  private authFlowInProgress = false;

  private static readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user_info',
  } as const;

  private loggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if (this.isBrowser()) {
      this.loggedInSubject.next(this.isLoggedIn());
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // --- État réactif de connexion ---

  isLoggedInObservable(): Observable<boolean> {
    return this.loggedInSubject.asObservable();
  }

  private setLoggedIn(value: boolean): void {
    this.loggedInSubject.next(value);
  }

  getCurrentUser(): UserSession | null {
    if (!this.isBrowser()) return null;

    const raw = localStorage.getItem(AuthService.STORAGE_KEYS.USER);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  }

  setAuthFlowInProgress(value: boolean): void {
    this.authFlowInProgress = value;
  }

  isAuthFlowInProgress(): boolean {
    return this.authFlowInProgress;
  }

  exchangeCodeForToken(code: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', this.clientId);
    body.set('client_secret', this.clientSecret);
    body.set('redirect_uri', this.redirectUri);
    body.set('code', code);

    return this.http.post(
      `${this.keycloakUrl}/realms/${environment.keycloak.realm}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      },
    );
  }

  register(dto: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, dto).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error.status === 503) {
            console.log(error);
            return timer(2000);
          }
          throw error;
        },
      }),
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      token,
      password,
      confirmPassword,
    });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const dto: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto);
  }

  completeProfile(dto: CompleteProfileRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/complete-profile`, dto);
  }

  loginWithGoogle(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const url =
      `${this.keycloakUrl}/realms/${environment.keycloak.realm}/protocol/openid-connect/auth` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_type=code` +
      `&scope=openid%20profile%20email` +
      `&kc_idp_hint=google`;

    window.location.href = url;
  }

  handleGoogleCallback(code: string): Observable<any> {
    const params = new HttpParams().set('code', code);
    return this.http.post(`${this.apiUrl}/auth/google/callback`, null, {
      params,
    });
  }

  syncGoogleUser(accessToken: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/google/sync`,
      {},
      { headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }) },
    );
  }

  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`);
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AuthService.STORAGE_KEYS.ACCESS_TOKEN, token);
      this.setLoggedIn(true);
    }
  }

  saveRefreshToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AuthService.STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem(AuthService.STORAGE_KEYS.ACCESS_TOKEN)
      : null;
  }

  refreshAccessToken(): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser'));
    }
    const refreshToken = localStorage.getItem(
      AuthService.STORAGE_KEYS.REFRESH_TOKEN,
    );
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.clientId);
    body.set('client_secret', this.clientSecret);
    body.set('refresh_token', refreshToken);

    return this.http.post(
      `${this.keycloakUrl}/realms/${environment.keycloak.realm}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      },
    );
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AuthService.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AuthService.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AuthService.STORAGE_KEYS.USER);
      this.setLoggedIn(false);
    }
  }

  saveUserInfo(user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AuthService.STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }

  getUserInfo(): any {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(AuthService.STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return this.getUserInfo()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const refreshToken = localStorage.getItem(
      AuthService.STORAGE_KEYS.REFRESH_TOKEN,
    );
    const keycloakId = localStorage.getItem('keycloak_id');
    const token = localStorage.getItem(AuthService.STORAGE_KEYS.ACCESS_TOKEN);

    const finalizeLogout = () => {
      localStorage.clear();
      this.setLoggedIn(false);

      if (refreshToken) {
        const body = new URLSearchParams();
        body.set('client_id', this.clientId);
        body.set('client_secret', this.clientSecret);
        body.set('refresh_token', refreshToken);
        fetch(
          `${this.keycloakUrl}/realms/${environment.keycloak.realm}/protocol/openid-connect/logout`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
          },
        ).catch(() => {});
      }

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      Toast.fire({ icon: 'success', title: 'Déconnexion réussie !' }).then(
        () => {
          window.location.href = '/signin';
        },
      );
    };

    const notifyLoginActivityThenFinalize = () => {
      if (keycloakId && token) {
        this.http
          .post(
            `${this.apiUrl}/api/login-activity/logout/${keycloakId}`,
            {},
            { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
          )
          .pipe(catchError(() => of(null)))
          .subscribe(() => finalizeLogout());
      } else {
        finalizeLogout();
      }
    };

    if (token) {
      this.http
        .post(
          `${this.apiUrl}/auth/logout`,
          {},
          { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
        )
        .pipe(catchError(() => of(null)))
        .subscribe(() => notifyLoginActivityThenFinalize());
    } else {
      notifyLoginActivityThenFinalize();
    }
  }
}
