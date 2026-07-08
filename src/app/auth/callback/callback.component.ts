import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { take } from 'rxjs/operators';
import { AuthService } from '../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';
import { ROLE_ROUTES } from '../../core/constant/role-route';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css',
})
export class CallbackComponent implements OnInit {
  message = 'Préparation de votre session...';
  stepIndex = 0;
  readonly totalSteps = 3;

  private isProcessing = false;
  private readonly roleRoutes = ROLE_ROUTES;

  private readonly STEP_DELAY = 1400;
  private readonly FINAL_DELAY = 1600;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notify: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isProcessing) return;
    this.isProcessing = true;

    // On lit les query params UNE SEULE FOIS (take(1)), pour ne jamais
    // se refaire déclencher par le navigate() qui nettoie l'URL plus tard.
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const code = params['code'];

      if (code) {
        this.runGoogleFlow(code);
      } else if (this.authService.isLoggedIn()) {
        this.runManualFlow();
      } else {
        this.notify.toast(
          'warning',
          'Session introuvable, veuillez vous reconnecter.',
        );
        this.router.navigate(['/signin']);
      }
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ───────────────────── GOOGLE FLOW ─────────────────────

  private runGoogleFlow(code: string): void {
    this.authService.clearTokens();
    this.setStep(0, 'Connexion avec Google en cours...');

    this.authService.exchangeCodeForToken(code).subscribe({
      next: (tokenData) => {
        // On ne nettoie l'URL qu'APRÈS avoir capturé le code avec succès,
        // et ce nettoyage ne redéclenchera plus rien puisque take(1)
        // a déjà consommé et désinscrit l'abonnement aux queryParams.
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
        this.handleTokenReceived(tokenData);
      },
      error: (err) => {
        console.error('Token error:', err);
        this.message = 'La connexion a échoué.';
        this.notify.error(
          'Connexion impossible',
          'Le lien de connexion Google a expiré ou est invalide. Veuillez réessayer.',
        );
        setTimeout(() => this.router.navigate(['/signin']), 2000);
      },
    });
  }

  private async handleTokenReceived(tokenData: any): Promise<void> {
    this.authService.saveToken(tokenData.access_token);
    this.authService.saveRefreshToken(tokenData.refresh_token);

    await this.wait(this.STEP_DELAY);
    this.setStep(1, 'Synchronisation de votre profil...');

    this.authService.syncGoogleUser(tokenData.access_token).subscribe({
      next: (user) => this.handleSyncSuccess(user),
      error: (err) => this.handleSyncError(err),
    });
  }

  private async handleSyncSuccess(user: any): Promise<void> {
    this.authService.saveUserInfo({
      id: user.id,
      keycloakId: user.keycloakId,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      genre: user.genre,
      num_Tel: user.num_Tel,
    });

    await this.wait(this.STEP_DELAY);
    this.setStep(2, `Bienvenue, ${user.prenom} !`);
    this.notify.toastSuccess(
      `Bonjour ${user.prenom} ! Votre profil est synchronisé ✓`,
    );

    await this.wait(this.FINAL_DELAY);
    this.checkProfileAndRedirect(user);
  }

  private async handleSyncError(err: any): Promise<void> {
    console.warn('Sync error:', err);

    await this.wait(this.STEP_DELAY);
    this.setStep(2, 'Redirection vers la complétion du profil...');
    this.notify.toast(
      'warning',
      'Synchronisation partielle, complétez votre profil pour continuer.',
    );

    await this.wait(this.FINAL_DELAY);
    this.router.navigate(['/complete-profile']);
  }

  // ───────────────────── MANUAL FLOW (signin / signup) ─────────────────────

  private async runManualFlow(): Promise<void> {
    this.setStep(0, 'Vérification de vos identifiants...');
    await this.wait(this.STEP_DELAY);

    this.setStep(1, 'Chargement de votre profil...');
    const cachedUser = this.authService.getUserInfo();
    await this.wait(this.STEP_DELAY);

    if (!cachedUser) {
      this.setStep(2, 'Profil introuvable, redirection...');
      await this.wait(this.FINAL_DELAY);
      this.router.navigate(['/complete-profile']);
      return;
    }

    this.setStep(2, `Bienvenue, ${cachedUser.prenom ?? ''} !`);
    this.notify.toastSuccess('Connexion réussie !');
    await this.wait(this.FINAL_DELAY);

    this.checkProfileAndRedirect(cachedUser);
  }

  private setStep(index: number, message: string): void {
    this.stepIndex = index;
    this.message = message;
  }

  // ───────────────────── SOURCE DE VÉRITÉ UNIQUE ─────────────────────

  private checkProfileAndRedirect(fallbackUser: any): void {
    this.authService.getMyProfile().subscribe({
      next: (fullProfile: any) => {
        const merged = { ...fallbackUser, ...fullProfile };
        this.authService.saveUserInfo(merged);

        const hasGenre = !!merged.genre;
        const hasTel =
          merged.num_Tel !== null &&
          merged.num_Tel !== undefined &&
          merged.num_Tel !== 0;
        const hasAdresse = !!merged.adresse;
        const hasDateNaissance = !!merged.dateNaissance;

        if (!hasGenre || !hasTel || !hasAdresse || !hasDateNaissance) {
          this.notify.toast(
            'info',
            'Complétez votre profil pour accéder à votre espace.',
          );
          this.router.navigate(['/complete-profile']);
          return;
        }

        this.notify.toastSuccess('Tout est prêt ! 🎉');
        this.router.navigate([
          this.roleRoutes[merged.role] ?? '/complete-profile',
        ]);
      },
      error: () => {
        this.router.navigate(['/complete-profile']);
      },
    });
  }
}
