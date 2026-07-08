import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';

@Component({
  selector: 'app-forget-paswword',
  templateUrl: './forget-paswword.component.html',
  styleUrl: './forget-paswword.component.css',
})
export class ForgetPaswwordComponent {
  form!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get email() {
    return this.form.get('email')!;
  }

  isEmailInvalid(): boolean {
    return this.email.invalid && (this.email.touched || this.email.dirty);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.errorMessage = '';

    if (this.form.invalid) {
      this.notify.toast('warning', 'Veuillez saisir un email valide.');
      return;
    }

    this.isLoading = true;
    const email = this.email.value.trim();

    this.authService.forgotPassword(email).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = res.message;

        this.notify
          .success(
            'Email envoyé !',
            res.message ||
              'Vérifiez votre boîte mail pour le lien de réinitialisation.',
          )
          .then(() => this.router.navigate(['/signin']));
      },
      error: () => {
        this.isLoading = false;
        this.successMessage = 'Si cet email existe, vous recevrez un lien.';
        this.notify.toast(
          'info',
          'Si cet email existe, vous recevrez un lien.',
        );
      },
    });
  }

  goToSignin(): void {
    this.router.navigate(['/signin']);
  }
}
