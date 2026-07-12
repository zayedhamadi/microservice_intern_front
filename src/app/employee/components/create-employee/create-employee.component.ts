import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AdminEmployeeService } from '../../../core/service/admin-employee.service';
import { Role } from '../../../core/models/enum';

interface RoleOption {
  value: Role;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrl: './create-employee.component.css',
})
export class CreateEmployeeComponent {
  form: FormGroup;
  isSubmitting = false;
  serverError: string | null = null;

  readonly roles: RoleOption[] = [
    {
      value: Role.EMPLOYEE,
      label: 'Employé',
      description: 'Accès à son espace personnel',
      icon: '👤',
    },
    
    {
      value: Role.RH,
      label: 'RH',
      description: 'Gère congés, recrutements et profils',
      icon: '🗂️',
    },
    
  ];

  constructor(
    private fb: FormBuilder,
    private adminEmployeeService: AdminEmployeeService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      nom: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      prenom: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
    });
  }

  selectRole(role: Role): void {
    this.form.get('role')?.setValue(role);
    this.form.get('role')?.markAsTouched();
  }

  isRoleSelected(role: Role): boolean {
    return this.form.get('role')?.value === role;
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get initials(): string {
    const nom = this.form.get('nom')?.value?.trim()?.[0] ?? '';
    const prenom = this.form.get('prenom')?.value?.trim()?.[0] ?? '';
    return (prenom + nom).toUpperCase() || '??';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    this.adminEmployeeService.createEmployee(this.form.value).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Compte créé avec succès',
          html: `
            <p>Les identifiants de connexion ont été envoyés à<br><b>${res.email}</b></p>
            <p style="margin-top:8px">Matricule&nbsp;: <b>${res.matricule}</b></p>
          `,
          confirmButtonText: 'Créer un autre',
          confirmButtonColor: '#6D28D9',
          showCancelButton: true,
          cancelButtonText: 'Retour au tableau de bord',
          cancelButtonColor: '#1E1B2E',
        }).then((result) => {
          if (result.isConfirmed) {
            this.form.reset();
          } else {
            this.router.navigate(['../dashboardmanager'], {
              relativeTo: this.route,
            });
          }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError =
          err?.error?.error ??
          'Une erreur est survenue lors de la création du compte.';
        Swal.fire({
          icon: 'error',
          title: 'Échec de la création',
          text: this.serverError ?? undefined,
          confirmButtonColor: '#6D28D9',
        });
      },
    });
  }

  resetForm(): void {
    this.form.reset();
    this.serverError = null;
  }
}
