import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';
import { ROLE_ROUTES } from '../../core/constant/role-route';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  showPwd = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  readonly MAX_ATTEMPTS = 3;
  readonly BLOCK_DURATION = 30;

  attemptsLeft = this.MAX_ATTEMPTS;
  isBlocked = false;
  blockCountdown = 0;
  attemptCountdown = 0;

  private blockTimer: any = null;
  private attemptTimer: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }
  /*
  onLogin(): void {
    if (this.isBlocked) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.clearTimers();
        this.attemptsLeft = this.MAX_ATTEMPTS;

        this.authService.saveToken(response.accessToken);
        this.authService.saveRefreshToken(response.refreshToken);
        this.authService.saveUserInfo({ ...response });

        this.isLoading = false;
        this.notify.toastSuccess('Connexion réussie !');
        this.redirectByProfile(response);
      },
      error: (err) => {
        this.isLoading = false;
        this.registerFailedAttempt();
        this.errorMessage =
          err.error?.error || 'Email ou mot de passe incorrect';
      },
    });
  }
*/
  onLogin(): void {
    if (this.isBlocked) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        this.clearTimers();
        this.attemptsLeft = this.MAX_ATTEMPTS;

        this.authService.saveToken(response.accessToken);
        this.authService.saveRefreshToken(response.refreshToken);
        this.authService.saveUserInfo({ ...response });

        this.isLoading = false;
        this.notify.toastSuccess('Connexion réussie !');
        this.router.navigate(['/callback']);
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
        this.registerFailedAttempt();
        this.errorMessage =
          err.error?.error || 'Email ou mot de passe incorrect';
      },
    });
  }
  private clearTimers(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
      this.blockTimer = null;
    }
    if (this.attemptTimer) {
      clearInterval(this.attemptTimer);
      this.attemptTimer = null;
    }
  }

  private registerFailedAttempt(): void {
    this.attemptsLeft--;

    if (this.attemptTimer) {
      clearInterval(this.attemptTimer);
      this.attemptTimer = null;
      this.attemptCountdown = 0;
    }

    if (this.attemptsLeft <= 0) {
      this.attemptsLeft = 0;
      this.startBlock();
      return;
    }

    this.startAttemptCountdown(30);
  }

  private startBlock(): void {
    this.isBlocked = true;
    this.blockCountdown = this.BLOCK_DURATION;
    this.form.disable();
    this.clearTimers();

    this.blockTimer = setInterval(() => {
      this.blockCountdown--;
      if (this.blockCountdown <= 0) this.unblock();
    }, 1000);
  }

  private unblock(): void {
    clearInterval(this.blockTimer);
    this.blockTimer = null;
    this.isBlocked = false;
    this.blockCountdown = 0;
    this.attemptsLeft = this.MAX_ATTEMPTS;
    this.attemptCountdown = 0;
    this.errorMessage = '';
    this.form.enable();
  }

  private startAttemptCountdown(seconds: number): void {
    this.attemptCountdown = seconds;
    this.attemptTimer = setInterval(() => {
      this.attemptCountdown--;
      if (this.attemptCountdown <= 0) {
        clearInterval(this.attemptTimer);
        this.attemptTimer = null;
        this.attemptCountdown = 0;
      }
    }, 1000);
  }

  private redirectByProfile(user: any): void {
    this.authService.getMyProfile().subscribe({
      next: (response) => {
        this.clearTimers();
        this.attemptsLeft = this.MAX_ATTEMPTS;

        this.authService.saveToken(response.accessToken);
        this.authService.saveRefreshToken(response.refreshToken);
        this.authService.saveUserInfo({ ...response });

        this.isLoading = false;
        this.router.navigate(['/callback']);
      },
      error: (err: any) => {
        console.log(err);
        this.router.navigate(['/signin']);
      },
    });
  }

  f(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  showError(name: string): boolean {
    const ctrl = this.f(name);
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  getError(name: string): string {
    const ctrl = this.f(name);
    if (!ctrl.errors) return '';
    const map: Record<string, Record<string, string>> = {
      email: {
        required: "L'email est requis.",
        email: 'Format invalide.',
        maxlength: 'Email trop long.',
      },
      password: {
        required: 'Le mot de passe est requis.',
        minlength: 'Minimum 6 caractères.',
      },
    };
    return map[name]?.[Object.keys(ctrl.errors)[0]] ?? 'Champ invalide.';
  }

  onForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  onGoogleSignup(): void {
    this.authService.loginWithGoogle();
  }
}
