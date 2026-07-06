import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, of, Observable, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../environement/environment';
import { RegisterRequest, AuthResponse, LoginRequest, CompleteProfileRequest } from '../models/user';




@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly keycloakUrl = environment.keycloak.url;
  private readonly clientId = environment.keycloak.clientId;
  private readonly clientSecret = environment.keycloak.clientSecret;
  private readonly redirectUri = environment.keycloak.redirectUri;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  register(dto: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, dto);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const dto: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto);
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

  /** Appelé depuis /callback avec le code reçu de Keycloak. */
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

  completeProfile(dto: CompleteProfileRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/complete-profile`, dto);
  }

  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`);
    // Le token est ajouté automatiquement par le JwtInterceptor, inutile de le remettre ici
  }

  // --- Gestion des tokens ---

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', token);
    }
  }

  saveRefreshToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('refresh_token', token);
    }
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem('access_token')
      : null;
  }

  refreshAccessToken(): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser'));
    }
    const refreshToken = localStorage.getItem('refresh_token');
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
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    }
  }

  // --- Infos utilisateur ---

  saveUserInfo(user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user_info', JSON.stringify(user));
    }
  }

  getUserInfo(): any {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem('user_info');
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

    const refreshToken = localStorage.getItem('refresh_token');
    const keycloakId = localStorage.getItem('keycloak_id');
    const token = localStorage.getItem('access_token');

    const doLogout = () => {
      localStorage.clear();

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

    if (keycloakId && token) {
      this.http
        .post(
          `${this.apiUrl}/api/login-activity/logout/${keycloakId}`,
          {},
          { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
        )
        .pipe(catchError(() => of(null)))
        .subscribe(() => doLogout());
    } else {
      doLogout();
    }
  }
}
