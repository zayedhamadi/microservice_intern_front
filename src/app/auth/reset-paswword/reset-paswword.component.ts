import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';

function passwordsMatch(group: AbstractControl) {
  const pwd = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd === confirm ? null : { mismatch: true };
}

function strongPassword(control: AbstractControl) {
  const v = control.value || '';
  const errors: any = {};
  if (v.length < 8) errors['minLength'] = true;
  if (!/[A-Z]/.test(v)) errors['noUppercase'] = true;
  if (!/[0-9]/.test(v)) errors['noNumber'] = true;
  if (!/[!@#$%^&*]/.test(v)) errors['noSymbol'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-reset-paswword',
  templateUrl: './reset-paswword.component.html',
  styleUrl: './reset-paswword.component.css',
})
export class ResetPaswwordComponent implements OnInit {
  form!: FormGroup;
  token = '';
  showPwd = false;
  showConfirm = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.token) {
      this.errorMessage = 'Lien invalide ou expiré.';
      this.notify
        .error(
          'Lien invalide',
          'Ce lien de réinitialisation est invalide ou expiré.',
        )
        .then(() => this.router.navigate(['/signin']));
      return;
    }

    this.form = this.fb.group(
      {
        newPassword: ['', [Validators.required, strongPassword]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatch },
    );
  }

  get pwd() {
    return this.form.get('newPassword')!;
  }
  get confirm() {
    return this.form.get('confirmPassword')!;
  }

  get pwdStrength(): number {
    const v = this.pwd.value || '';
    let s = 0;
    if (v.length >= 8) s += 25;
    if (/[A-Z]/.test(v)) s += 25;
    if (/[0-9]/.test(v)) s += 25;
    if (/[!@#$%^&*]/.test(v)) s += 25;
    return s;
  }

  get pwdClass(): string {
    const s = this.pwdStrength;
    if (s <= 25) return 'weak';
    if (s <= 50) return 'fair';
    if (s <= 75) return 'medium';
    return 'strong';
  }

  get pwdLabel(): string {
    const s = this.pwdStrength;
    if (s <= 25) return 'Très faible';
    if (s <= 50) return 'Faible';
    if (s <= 75) return 'Moyen';
    return 'Fort';
  }

  isPwdInvalid(): boolean {
    return this.pwd.invalid && (this.pwd.dirty || this.pwd.touched);
  }

  isConfirmInvalid(): boolean {
    const mismatch = this.form.errors?.['mismatch'] && this.confirm.touched;
    return (this.confirm.invalid && this.confirm.touched) || !!mismatch;
  }

  getPwdErrors(): string[] {
    const errors: string[] = [];
    const e = this.pwd.errors;
    if (!e) return errors;
    if (e['required']) errors.push('Le mot de passe est obligatoire');
    if (e['minLength']) errors.push('Minimum 8 caractères');
    if (e['noUppercase']) errors.push('Au moins une majuscule');
    if (e['noNumber']) errors.push('Au moins un chiffre');
    if (e['noSymbol']) errors.push('Au moins un symbole (!@#$%^&*)');
    return errors;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.errorMessage = '';

    if (this.form.invalid) {
      this.notify.toast(
        'warning',
        'Veuillez corriger les erreurs du formulaire.',
      );
      return;
    }

    this.notify
      .confirm(
        'Réinitialiser le mot de passe ?',
        'Votre ancien mot de passe sera remplacé définitivement.',
        'Oui, réinitialiser !',
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.isLoading = true;

        this.authService
          .resetPassword(this.token, this.pwd.value, this.confirm.value)
          .subscribe({
            next: (res: any) => {
              this.isLoading = false;
              this.successMessage = res.message;

              this.notify
                .success(
                  'Mot de passe réinitialisé !',
                  res.message || 'Vous pouvez maintenant vous connecter.',
                )
                .then(() => this.router.navigate(['/signin']));
            },
            error: (err) => {
              this.isLoading = false;
              this.notify.error(
                'Erreur',
                err.error?.error || 'Erreur lors du reset',
              );
            },
          });
      });
  }

  sigin(): void {
    this.router.navigate(['/signin']);
  }
}
