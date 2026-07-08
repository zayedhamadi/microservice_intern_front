import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';

export const passwordMatchValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordMismatch: true } : null;
};

export const passwordStrengthValidator: ValidatorFn = (
  ctrl: AbstractControl,
): ValidationErrors | null => {
  const v: string = ctrl.value || '';
  if (!v) return null;
  const hasUpper = /[A-Z]/.test(v);
  const hasNumOrSpecial = /[0-9!@#$%^&*]/.test(v);
  return hasUpper && hasNumOrSpecial ? null : { weakPassword: true };
};

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent implements OnInit {
  form!: FormGroup;

  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPwd = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        nom: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZÀ-ÿ\s'\-]+$/),
          ],
        ],
        prenom: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZÀ-ÿ\s'\-]+$/),
          ],
        ],
        email: [
          '',
          [Validators.required, Validators.email, Validators.maxLength(100)],
        ],
        role: ['EMPLOYEE', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(64),
            passwordStrengthValidator,
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );
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
      nom: {
        required: 'Le nom est requis.',
        minlength: 'Minimum 2 caractères.',
        maxlength: 'Maximum 50 caractères.',
        pattern: 'Lettres et tirets uniquement.',
      },
      prenom: {
        required: 'Le prénom est requis.',
        minlength: 'Minimum 2 caractères.',
        maxlength: 'Maximum 50 caractères.',
        pattern: 'Lettres et tirets uniquement.',
      },
      email: {
        required: "L'email est requis.",
        email: "Format d'email invalide.",
        maxlength: 'Email trop long.',
      },
      password: {
        required: 'Le mot de passe est requis.',
        minlength: 'Minimum 8 caractères.',
        maxlength: 'Maximum 64 caractères.',
        weakPassword:
          'Ajoutez une majuscule et un chiffre / caractère spécial.',
      },
      confirmPassword: {
        required: 'Veuillez confirmer le mot de passe.',
      },
    };

    const fieldErrors = map[name] || {};
    const firstKey = Object.keys(ctrl.errors)[0];
    return fieldErrors[firstKey] ?? 'Champ invalide.';
  }

  hasUpper(v: string): boolean {
    return /[A-Z]/.test(v || '');
  }
  hasNumber(v: string): boolean {
    return /[0-9]/.test(v || '');
  }
  hasSpecial(v: string): boolean {
    return /[!@#$%^&*]/.test(v || '');
  }

  get pwdStrength(): number {
    const p: string = this.f('password').value || '';
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s += 33;
    if (/[A-Z]/.test(p)) s += 33;
    if (/[0-9!@#$%^&*]/.test(p)) s += 34;
    return s;
  }

  get pwdClass(): string {
    const s = this.pwdStrength;
    if (s <= 33) return 'weak';
    if (s <= 66) return 'medium';
    return 'strong';
  }

  get pwdLabel(): string {
    const s = this.pwdStrength;
    if (s <= 33) return 'Faible';
    if (s <= 66) return 'Moyen';
    return 'Fort';
  }

  onRegister(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { nom, prenom, email, password, role } = this.form.value;

    this.authService
      .register({ nom, prenom, email, password, role })
      .subscribe({
        next: () => {
          this.notify.toastSuccess('Compte créé ! Connexion en cours…');
          this.autoLoginAfterRegister(email, password);
        },
        error: (err: any) => {
          console.log('Signup error:', err);
          this.isLoading = false;

          if (err.status === 201) {
            this.router.navigate(['/signin']);
            return;
          }

          const message =
            err.error?.error ||
            err.error?.message ||
            "Erreur lors de l'inscription";
          this.errorMessage = message;
          this.notify.error("Erreur d'inscription", message);
        },
      });
  }

  private autoLoginAfterRegister(email: string, password: string): void {
    this.authService.login(email, password).subscribe({
      next: (loginRes) => {
        this.authService.saveToken(loginRes.accessToken);
        this.authService.saveRefreshToken(loginRes.refreshToken);
        this.authService.saveUserInfo({
          id: loginRes.id,
          keycloakId: loginRes.keycloakId,
          email: loginRes.email,
          nom: loginRes.nom,
          prenom: loginRes.prenom,
          role: loginRes.role,
        });

        this.isLoading = false;
        this.router.navigate(['/callback']); 
      },
      error: (err: any) => {
        console.log('Signup error:', err);
        this.isLoading = false;
        this.notify
          .warning(
            'Connexion échouée',
            'Compte créé mais connexion impossible. Veuillez vous connecter manuellement.',
            'Aller à la connexion',
          )
          .then(() => this.router.navigate(['/signin']));
      },
    });
  }

  onGoogleSignup(): void {
    this.authService.loginWithGoogle();
  }
}
