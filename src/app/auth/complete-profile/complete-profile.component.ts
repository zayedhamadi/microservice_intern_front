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
import { FileUserMongoService } from '../../core/service/file-user-mongo.service'; 
import { ROLE_ROUTES } from '../../core/constant/role-route';
import { Role } from '../../core/models/enum';

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

const ROLES_AVEC_ETUDES: Role[] = [Role.EMPLOYEE, Role.CANDIDAT];

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.css',
})
export class CompleteProfileComponent implements OnInit {
  private hadRoleAlready = false;
  readonly Role = Role;

  currentStep = 1;
  selectedRole: Role | null = null;

  form!: FormGroup;
  imagePreview: string | null = null;
  imageBase64: string | null = null;
  imageError = '';

  // --- CV : désormais géré via recrutement-service, plus via le payload profil ---
  cvFile: File | null = null; // <-- fichier réel, nécessaire pour FormData
  cvBase64: string | null = null; // preview locale uniquement
  cvFileName: string | null = null;
  cvError = '';

  isLoading = false;
  isInitializing = true;
  userName = '';

  currentRole: Role | null = null;

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
    private fileUserMongoService: FileUserMongoService, // <-- ajouté
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
    this.currentRole = (cached?.role as Role) || null;
    this.selectedRole = this.currentRole;
    this.hadRoleAlready = this.currentRole !== null;

    this.authService.getMyProfile().subscribe({
      next: (profile: any) => this.applyExistingProfile(profile),
      error: () => {
        this.isInitializing = false;
      },
    });

    this.loadExistingCv(); // <-- CV chargé séparément, plus via getMyProfile()
  }

  private loadExistingCv(): void {
    this.fileUserMongoService.getMyCv().subscribe({
      next: (cv) => {
        if (cv.exists) {
          this.cvFileName = cv.cvFileName ?? 'CV actuel.pdf';
          this.cvBase64 = cv.cvBase64 ?? null;
        }
      },
      error: () => {
        // pas de CV existant, ou recrutement-service indisponible — non bloquant
      },
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      genre: ['', Validators.required],
      dateNaissance: ['', [Validators.required, birthDateValidator]],
      num_Tel: ['', [Validators.required, phoneValidator]],
      adresse: ['', [Validators.required, Validators.minLength(3)]],

      description: ['', Validators.maxLength(300)],
      linkedin: [''],
      twitter: [''],
      siteweb: [''],

      specialiteEtude: [''],
      universiteEtude: [''],
      niveauEtude: [''],
      anneesExperience: [null, [Validators.min(0), Validators.max(60)]],
    });
  }

  private applyExistingProfile(profile: any): void {
    this.currentRole = (profile?.role as Role) || this.currentRole || null;
    this.selectedRole = this.currentRole;
    this.hadRoleAlready = this.currentRole !== null;
    this.userName = profile?.prenom || this.userName;

    this.form.patchValue({
      genre: profile?.genre || '',
      dateNaissance: profile?.dateNaissance || '',
      num_Tel: profile?.num_Tel ? String(profile.num_Tel) : '',
      adresse: profile?.adresse || '',
      description: profile?.description || '',
      linkedin: profile?.linkedin || '',
      twitter: profile?.twitter || '',
      siteweb: profile?.siteweb || '',
      specialiteEtude: profile?.specialiteEtude || '',
      universiteEtude: profile?.universiteEtude || '',
      niveauEtude: profile?.niveauEtude || '',
      anneesExperience: profile?.anneesExperience ?? null,
    });

    if (profile?.imageBase64) {
      this.imagePreview = profile.imageBase64;
    }
    // cvBase64 retiré : profile n'expose plus le CV (voir loadExistingCv)

    this.applyRoleSpecificValidators();
    this.isInitializing = false;
  }

  private requiresEtudes(): boolean {
    return (
      this.currentRole !== null && ROLES_AVEC_ETUDES.includes(this.currentRole)
    );
  }

  needsRoleSelection(): boolean {
    return this.currentRole === null && this.selectedRole === null;
  }

  chooseRole(role: Role): void {
    this.selectedRole = role;
    this.currentRole = role;
    this.applyRoleSpecificValidators();
  }

  private applyRoleSpecificValidators(): void {
    const specialite = this.form.get('specialiteEtude')!;
    const niveau = this.form.get('niveauEtude')!;

    if (this.requiresEtudes()) {
      specialite.setValidators([Validators.required]);
      niveau.setValidators([Validators.required]);
    } else {
      specialite.clearValidators();
      niveau.clearValidators();
    }
    specialite.updateValueAndValidity();
    niveau.updateValueAndValidity();
  }

  // --- CV : toujours la dernière étape, pour tous les rôles ---
  get totalSteps(): number {
    return this.requiresEtudes() ? 4 : 3; // Infos, Bio, [Études], CV
  }

  get etudesStepIndex(): number | null {
    return this.requiresEtudes() ? 3 : null;
  }

  get cvStepIndex(): number {
    return this.totalSteps; // toujours la dernière étape
  }

  private get stepFields(): Record<number, string[]> {
    const fields: Record<number, string[]> = {
      1: ['genre', 'dateNaissance', 'num_Tel', 'adresse'],
      2: [],
    };
    if (this.etudesStepIndex !== null) {
      fields[this.etudesStepIndex] = ['specialiteEtude', 'niveauEtude'];
    }
    fields[this.cvStepIndex] = []; // CV optionnel, pas de validation bloquante
    return fields;
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
    if (this.currentStep > 1) this.currentStep--;
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

  onCvSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;
    this.cvError = '';

    if (file.type !== 'application/pdf') {
      this.cvError = 'Fichier invalide ! Sélectionnez un PDF.';
      this.notify.toast('error', this.cvError);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.cvError = 'CV trop volumineux ! Maximum 5MB.';
      this.notify.toast('error', this.cvError);
      return;
    }

    this.cvFile = file; // <-- gardé pour l'upload réel vers recrutement-service

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.cvBase64 = e.target.result;
      this.cvFileName = file.name;
      this.notify.toast('success', 'CV ajouté avec succès !');
    };
    reader.readAsDataURL(file);
  }

  removeCv(): void {
    this.cvFile = null;
    this.cvBase64 = null;
    this.cvFileName = null;
    this.cvError = '';
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
      role: this.hadRoleAlready ? null : this.selectedRole,
      num_Tel: raw.num_Tel ? Number(raw.num_Tel) : null,
      imageBase64: this.imageBase64 || null,
      // cvBase64 retiré : géré séparément via recrutement-service
    };

    this.authService.completeProfile(payload).subscribe({
      next: (res: any) => {
        this.handleCvUpload(res); // <-- envoie le CV après succès du profil
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

  private handleCvUpload(res: any): void {
    if (!this.cvFile) {
      this.finishComplete(res);
      return;
    }

    this.fileUserMongoService.uploadCv(this.cvFile).subscribe({
      next: () => this.finishComplete(res),
      error: () => {
        // profil déjà sauvegardé — on n'échoue pas tout pour un CV en erreur
        this.notify.toast(
          'warning',
          "Profil enregistré, mais l'envoi du CV a échoué. Réessayez depuis votre profil.",
        );
        this.finishComplete(res);
      },
    });
  }

  private finishComplete(res: any): void {
    this.isLoading = false;

    const existing = this.authService.getUserInfo() ?? {};
    this.authService.saveUserInfo({ ...existing, role: res.role });

    this.notify
      .success('Profil complété !', 'Redirection vers votre espace...')
      .then(() => this.redirectByRole(res.role));
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
