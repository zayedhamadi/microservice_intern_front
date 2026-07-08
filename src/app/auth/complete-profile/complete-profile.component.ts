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
import { ROLE_ROUTES } from '../../core/constant/role-route';

export const phoneValidator: ValidatorFn = (
  ctrl: AbstractControl,
): ValidationErrors | null => {
  const v: string = (ctrl.value ?? '').toString().trim();
  if (!v) return null;
  return /^\d{8}$/.test(v) ? null : { invalidPhone: true };
};

export const birthDateValidator: ValidatorFn = (
  ctrl: AbstractControl,
): ValidationErrors | null => {
  const v: string = ctrl.value;
  if (!v) return null;
  const birth = new Date(v);
  const today = new Date();
  if (isNaN(birth.getTime())) return { invalidDate: true };
  if (birth > today) return { futureDate: true };
  const age =
    today.getFullYear() -
    birth.getFullYear() -
    (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
      ? 1
      : 0);
  return age >= 18 ? null : { underage: true };
};

// Rôles réellement supportés par le backend (enum Role.java)
type BackendRole = 'RH' | 'EMPLOYEE' | 'CANDIDAT';
const ROLES_AVEC_ETUDES: BackendRole[] = ['EMPLOYEE', 'CANDIDAT'];

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.css',
})
export class CompleteProfileComponent implements OnInit {
  currentStep = 1;

  form!: FormGroup;
  imagePreview: string | null = null;
  imageBase64: string | null = null;
  imageError = '';
  isLoading = false;
  isInitializing = true;
  userName = '';

  /** true si l'utilisateur a déjà un rôle en base (ex: signup classique) */
  hasExistingRole = false;

  readonly niveauxEtude = [
    { value: 'BTS', label: 'BTS' },
    { value: 'LICENCE', label: 'Licence' },
    { value: 'MASTER', label: 'Master' },
    { value: 'INGENIEUR', label: 'Ingénieur' },
    { value: 'DOCTORAT', label: 'Doctorat' },
    { value: 'AUTRE', label: 'Autre' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/signin']);
      return;
    }

    this.buildForm();

    const cached = this.authService.getUserInfo();
    this.userName = cached?.prenom ?? '';

    // Toujours vérifier l'état réel du profil côté backend (le cache
    // localStorage après login/signup ne contient pas genre/num_Tel/etc.)
    this.authService.getMyProfile().subscribe({
      next: (profile: any) => this.applyExistingProfile(profile),
      error: () => {
        this.isInitializing = false;
      },
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Étape "rôle" — uniquement si pas encore assigné
      role: [''],

      // Étape infos personnelles — obligatoire pour tous les rôles
      genre: ['', Validators.required],
      dateNaissance: ['', [Validators.required, birthDateValidator]],
      num_Tel: ['', [Validators.required, phoneValidator]],
      adresse: ['', [Validators.required, Validators.minLength(3)]],

      // Étape bio — optionnelle pour tous
      description: ['', Validators.maxLength(300)],
      linkedin: [''],
      twitter: [''],
      siteweb: [''],

      // Étape études — obligatoire seulement pour EMPLOYEE / CANDIDAT
      specialiteEtude: [''],
      niveauEtude: [''],
      anneesExperience: [null, [Validators.min(0), Validators.max(60)]],
    });
  }

  private applyExistingProfile(profile: any): void {
    this.hasExistingRole = !!profile?.role;
    this.userName = profile?.prenom || this.userName;

    this.form.patchValue({
      role: profile?.role || '',
      genre: profile?.genre || '',
      dateNaissance: profile?.dateNaissance || '',
      num_Tel: profile?.num_Tel ? String(profile.num_Tel) : '',
      adresse: profile?.adresse || '',
      description: profile?.description || '',
      linkedin: profile?.linkedin || '',
      twitter: profile?.twitter || '',
      siteweb: profile?.siteweb || '',
      specialiteEtude: profile?.specialiteEtude || '',
      niveauEtude: profile?.niveauEtude || '',
      anneesExperience: profile?.anneesExperience ?? null,
    });

    if (profile?.imageBase64) {
      this.imagePreview = profile.imageBase64;
    }

    if (this.hasExistingRole) {
      // Rôle déjà assigné : on saute directement l'étape 1.
      this.currentStep = 2;
    }

    this.applyRoleSpecificValidators(this.form.get('role')!.value);
    this.isInitializing = false;
  }

  /** Le rôle nécessite-t-il un parcours académique obligatoire ? */
  private requiresEtudes(role: string): boolean {
    return ROLES_AVEC_ETUDES.includes(role as BackendRole);
  }

  private applyRoleSpecificValidators(role: string): void {
    const specialite = this.form.get('specialiteEtude')!;
    const niveau = this.form.get('niveauEtude')!;

    if (this.requiresEtudes(role)) {
      specialite.setValidators([Validators.required]);
      niveau.setValidators([Validators.required]);
    } else {
      specialite.clearValidators();
      niveau.clearValidators();
    }
    specialite.updateValueAndValidity();
    niveau.updateValueAndValidity();
  }

  /** Nombre total d'étapes, dépend du rôle et si déjà assigné */
  get totalSteps(): number {
    const role = this.form?.get('role')?.value;
    const roleStep = this.hasExistingRole ? 0 : 1; // étape "rôle" comptée ou non
    const etudesStep = this.requiresEtudes(role) ? 1 : 0;
    return roleStep + 2 /* infos + bio */ + etudesStep;
  }

  private get stepFields(): Record<number, string[]> {
    // Mapping dynamique basé sur l'étape "rôle" active ou non
    if (this.hasExistingRole) {
      return {
        2: ['genre', 'dateNaissance', 'num_Tel', 'adresse'],
        3: [],
        4: this.requiresEtudes(this.form.get('role')!.value)
          ? ['specialiteEtude', 'niveauEtude']
          : [],
      };
    }
    return {
      1: ['role'],
      2: ['genre', 'dateNaissance', 'num_Tel', 'adresse'],
      3: [],
      4: this.requiresEtudes(this.form.get('role')!.value)
        ? ['specialiteEtude', 'niveauEtude']
        : [],
    };
  }

  f(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  showError(name: string): boolean {
    const c = this.f(name);
    return c.invalid && (c.dirty || c.touched);
  }

  getError(name: string): string {
    const c = this.f(name);
    if (!c.errors) return '';
    const map: Record<string, Record<string, string>> = {
      role: { required: 'Veuillez choisir un rôle.' },
      genre: { required: 'Veuillez sélectionner votre genre.' },
      dateNaissance: {
        required: 'La date de naissance est requise.',
        invalidDate: 'Date invalide.',
        futureDate: 'La date ne peut pas être dans le futur.',
        underage: 'Vous devez avoir au moins 18 ans.',
      },
      num_Tel: {
        required: 'Le numéro de téléphone est requis.',
        invalidPhone: 'Doit contenir exactement 8 chiffres.',
      },
      adresse: {
        required: "L'adresse est requise.",
        minlength: 'Minimum 3 caractères.',
      },
      description: { maxlength: 'Maximum 300 caractères.' },
      specialiteEtude: { required: 'La spécialité est requise pour ce rôle.' },
      niveauEtude: { required: "Le niveau d'étude est requis pour ce rôle." },
      anneesExperience: { min: 'Minimum 0.', max: 'Maximum 60 ans.' },
    };
    const firstKey = Object.keys(c.errors)[0];
    return map[name]?.[firstKey] ?? 'Champ invalide.';
  }

  onRoleSelected(role: BackendRole): void {
    this.form.get('role')!.setValue(role);
    this.applyRoleSpecificValidators(role);
  }

  nextStep(): void {
    const fields = this.stepFields[this.currentStep] ?? [];
    fields.forEach((f) => this.form.get(f)!.markAsTouched());
    const stepInvalid = fields.some((f) => this.form.get(f)!.invalid);

    if (stepInvalid) {
      this.notify.toast(
        'warning',
        'Veuillez remplir tous les champs correctement.',
      );
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    const minStep = this.hasExistingRole ? 2 : 1;
    if (this.currentStep > minStep) this.currentStep--;
  }

  onImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;
    this.imageError = '';

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Fichier invalide ! Sélectionnez une image.';
      this.notify.toast('error', this.imageError);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.imageError = 'Image trop grande ! Maximum 2MB.';
      this.notify.toast('error', this.imageError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.imageBase64 = e.target.result;
      this.notify.toast('success', 'Image ajoutée avec succès !');
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = null;
    this.imageBase64 = null;
    this.imageError = '';
  }

  async onComplete(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notify.toast(
        'warning',
        'Veuillez corriger les erreurs avant de continuer.',
      );
      return;
    }

    const confirmed = await this.notify.confirm(
      'Confirmer votre profil ?',
      'Voulez-vous soumettre ces informations ?',
      'Oui, confirmer !',
    );
    if (!confirmed) return;

    this.isLoading = true;

    const raw = this.form.value;
    const payload = {
      ...raw,
      // rôle : n'envoyer que s'il n'était pas déjà assigné
      role: this.hasExistingRole ? undefined : raw.role,
      num_Tel: raw.num_Tel ? Number(raw.num_Tel) : null,
      imageBase64: this.imageBase64 || null,
    };

    this.authService.completeProfile(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        const existing = this.authService.getUserInfo() ?? {};
        this.authService.saveUserInfo({ ...existing, role: res.role });

        this.notify
          .success('Profil complété !', 'Redirection vers votre espace...')
          .then(() => this.redirectByRole(res.role));
      },
      error: (err: any) => {
        console.log(err);
        this.isLoading = false;
        this.notify.error(
          'Erreur',
          err.error?.error || 'Erreur lors de la mise à jour.',
        );
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private redirectByRole(role: string): void {
    this.router.navigate([ROLE_ROUTES[role] ?? '/home']);
  }

  onSkip(): void {
    this.notify
      .confirm(
        'Passer cette étape ?',
        'Vous pourrez compléter votre profil plus tard.',
        'Oui, passer',
      )
      .then((confirmed) => {
        if (confirmed) this.router.navigate(['/home']);
      });
  }
}
