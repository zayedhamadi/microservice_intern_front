import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import Swal from 'sweetalert2';

import { UpdateProfileRequest } from '../core/models/update_profile.model';
import { UserService } from '../core/service/user.service';
import { CertificationService } from '../core/service/certification.service';
import { CertificationDTO } from '../core/models/CertificationDTO';

const phoneValidator: ValidatorFn = (
  c: AbstractControl,
): ValidationErrors | null => {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;
  return /^[259]\d{7}$/.test(v) ? null : { invalidPhone: true };
};

const birthDateValidator: ValidatorFn = (
  c: AbstractControl,
): ValidationErrors | null => {
  if (!c.value) return null;
  const birth = new Date(c.value),
    today = new Date();
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

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

@Component({
  selector: 'app-update-profil',
  templateUrl: './update-profil.component.html',
  styleUrl: './update-profil.component.css',
})
export class UpdateProfilComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isLoadingProfile = true;

  imagePreview: string | null = null;
  imageBase64: string | null = null;
  imageError = '';

  cvPreviewName: string | null = null;
  cvBase64: string | null = null; // nouveau CV sélectionné (à envoyer)
  existingCvBase64: string | null = null; // ✅ CV déjà présent en base, chargé depuis le profil
  cvError = '';

  // ✅ Modal de visualisation du CV
  showCvModal = false;

  activeTab = 0;
  showPw0 = false;
  showPw1 = false;
  showPw2 = false;

  role = '';
  requiresEtudes = false;

  certifications: CertificationDTO[] = [];
  isLoadingCertifs = false;
  isSavingCertif = false;
  newCertifTitre = '';
  newCertifDescription = '';
  newCertifPdfBase64: string | null = null;
  newCertifPdfName: string | null = null;
  certifError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private certificationService: CertificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadProfile();
    this.loadCertifications();
  }

  private initializeForm(): void {
    this.form = this.fb.group(
      {
        nom: ['', [Validators.required, Validators.minLength(2)]],
        prenom: ['', [Validators.required, Validators.minLength(2)]],
        genre: [''],
        dateNaissance: ['', birthDateValidator],
        num_Tel: ['', phoneValidator],
        adresse: ['', Validators.minLength(3)],
        anneesExperience: [null, [Validators.min(0), Validators.max(60)]],
        description: ['', Validators.maxLength(300)],
        linkedin: [''],
        twitter: [''],
        siteweb: [''],
        specialiteEtude: [''],
        universiteEtude: [''],
        niveauEtude: [''],
        currentPassword: [''],
        newPassword: ['', Validators.minLength(8)],
        confirmPassword: [''],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (profile: any) => {
        this.role = profile.role;
        this.requiresEtudes =
          profile.requiresEtudes ??
          (this.role === 'CANDIDAT' || this.role === 'EMPLOYEE');

        this.form.patchValue({
          nom: profile.nom ?? '',
          prenom: profile.prenom ?? '',
          genre: profile.genre ?? '',
          dateNaissance: profile.dateNaissance ?? '',
          num_Tel: profile.num_Tel ?? '',
          adresse: profile.adresse ?? '',
          anneesExperience: profile.anneesExperience ?? null,
          description: profile.description ?? '',
          linkedin: profile.linkedin ?? '',
          twitter: profile.twitter ?? '',
          siteweb: profile.siteweb ?? '',
          specialiteEtude: profile.specialiteEtude ?? '',
          universiteEtude: profile.universiteEtude ?? '',
          niveauEtude: profile.niveauEtude ?? '',
        });

        if (profile.imageBase64) this.imagePreview = profile.imageBase64;

        // ✅ Récupère le CV déjà existant pour permettre sa visualisation
        if (profile.cvBase64) {
          this.cvPreviewName = 'CV actuel.pdf';
          this.existingCvBase64 = profile.cvBase64;
        }

        this.isLoadingProfile = false;
      },
      error: () => {
        this.isLoadingProfile = false;
        Toast.fire({ icon: 'error', title: 'Erreur de chargement du profil' });
      },
    });
  }

  private passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const np = g.get('newPassword')?.value;
    const cp = g.get('confirmPassword')?.value;
    if (!np && !cp) return null;
    return np === cp ? null : { passwordMismatch: true };
  }

  f(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  showError(name: string): boolean {
    const c = this.f(name);
    return c.invalid && (c.dirty || c.touched);
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageError = '';

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Seules les images sont autorisées (JPG, PNG).';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.imageError = 'Taille maximale dépassée (2 Mo).';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target!.result as string;
      this.imagePreview = result;
      this.imageBase64 = result;
      Toast.fire({ icon: 'success', title: 'Photo téléchargée' });
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = null;
    this.imageBase64 = null;
    Toast.fire({ icon: 'info', title: 'Photo supprimée' });
  }

  // --- CV : disponible pour TOUS les rôles ---
  onCvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.cvError = '';

    if (file.type !== 'application/pdf') {
      this.cvError = 'Seuls les fichiers PDF sont autorisés.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.cvError = 'Taille maximale dépassée (5 Mo).';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.cvBase64 = e.target!.result as string;
      this.cvPreviewName = file.name;
      Toast.fire({ icon: 'success', title: 'CV téléchargé' });
    };
    reader.readAsDataURL(file);
  }

  removeCv(): void {
    this.cvBase64 = null;
    this.existingCvBase64 = null; // ✅ on efface aussi la référence à l'ancien CV
    this.cvPreviewName = null;
    Toast.fire({ icon: 'info', title: 'CV supprimé' });
  }

  // ✅ URL à afficher : le nouveau CV sélectionné en priorité, sinon celui déjà en base
  get cvSrc(): string | null {
    const raw = this.cvBase64 || this.existingCvBase64;
    if (!raw) return null;
    return raw.startsWith('data:') ? raw : `data:application/pdf;base64,${raw}`;
  }

  get hasCvToShow(): boolean {
    return !!this.cvSrc;
  }

  openCvModal(): void {
    if (!this.hasCvToShow) return;
    this.showCvModal = true;
  }

  closeCvModal(): void {
    this.showCvModal = false;
  }

  downloadCv(): void {
    if (!this.cvSrc) return;
    const link = document.createElement('a');
    link.href = this.cvSrc;
    link.download = `CV_${this.f('prenom').value || 'utilisateur'}_${this.f('nom').value || ''}.pdf`;
    link.click();
  }

  // --- Certifications (inchangé) ---
  loadCertifications(): void {
    this.isLoadingCertifs = true;
    this.certificationService.getMyCertifications().subscribe({
      next: (certifs) => {
        this.certifications = certifs;
        this.isLoadingCertifs = false;
      },
      error: () => {
        this.isLoadingCertifs = false;
        Toast.fire({
          icon: 'error',
          title: 'Erreur de chargement des certifications',
        });
      },
    });
  }

  onCertifPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.certifError = '';

    if (file.type !== 'application/pdf') {
      this.certifError = 'Seuls les fichiers PDF sont autorisés.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.certifError = 'Taille maximale dépassée (5 Mo).';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.newCertifPdfBase64 = e.target!.result as string;
      this.newCertifPdfName = file.name;
    };
    reader.readAsDataURL(file);
  }

  addCertification(): void {
    if (!this.newCertifTitre.trim()) {
      this.certifError = 'Le titre est obligatoire.';
      return;
    }
    if (!this.newCertifPdfBase64) {
      this.certifError = 'Veuillez joindre le PDF de la certification.';
      return;
    }

    this.isSavingCertif = true;
    this.certificationService
      .addCertification({
        titre: this.newCertifTitre.trim(),
        description: this.newCertifDescription.trim(),
        pdfBase64: this.newCertifPdfBase64,
      })
      .subscribe({
        next: (created) => {
          this.certifications = [...this.certifications, created];
          this.isSavingCertif = false;
          this.newCertifTitre = '';
          this.newCertifDescription = '';
          this.newCertifPdfBase64 = null;
          this.newCertifPdfName = null;
          Toast.fire({ icon: 'success', title: 'Certification ajoutée' });
        },
        error: (err) => {
          this.isSavingCertif = false;
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            "Erreur lors de l'ajout.";
          Toast.fire({ icon: 'error', title: msg });
        },
      });
  }

  deleteCertification(id: number): void {
    Swal.fire({
      title: 'Supprimer cette certification ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E24B4A',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.certificationService.deleteCertification(id).subscribe({
        next: () => {
          this.certifications = this.certifications.filter(
            (c) => c.idCertification !== id,
          );
          Toast.fire({ icon: 'info', title: 'Certification supprimée' });
        },
        error: () =>
          Toast.fire({ icon: 'error', title: 'Erreur lors de la suppression' }),
      });
    });
  }

  downloadCertif(certif: CertificationDTO): void {
    if (!certif.pdfBase64) return;
    const link = document.createElement('a');
    link.href = certif.pdfBase64;
    link.download = `${certif.titre}.pdf`;
    link.click();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Toast.fire({ icon: 'warning', title: 'Veuillez corriger les erreurs.' });
      return;
    }

    Swal.fire({
      title: 'Confirmer les modifications ?',
      text: 'Vos informations seront mises à jour',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7C3AED',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.isLoading = true;
      const v = this.form.value;

      const payload: UpdateProfileRequest = {
        nom: v.nom || undefined,
        prenom: v.prenom || undefined,
        genre: v.genre || undefined,
        dateNaissance: v.dateNaissance || undefined,
        num_Tel: v.num_Tel ? Number(v.num_Tel) : undefined,
        adresse: v.adresse || undefined,
        anneesExperience:
          v.anneesExperience != null ? Number(v.anneesExperience) : undefined,
        description: v.description || undefined,
        linkedin: v.linkedin || undefined,
        twitter: v.twitter || undefined,
        siteweb: v.siteweb || undefined,
        imageBase64: this.imageBase64 || undefined,
        cvBase64: this.cvBase64 || undefined,
        currentPassword: v.currentPassword || undefined,
        newPassword: v.newPassword || undefined,
        confirmPassword: v.confirmPassword || undefined,
      };

      if (this.requiresEtudes) {
        payload.specialiteEtude = v.specialiteEtude || undefined;
        payload.universiteEtude = v.universiteEtude || undefined;
        payload.niveauEtude = v.niveauEtude || undefined;
      }

      this.userService.updateProfile(payload).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({
            title: '✅ Profil mis à jour !',
            text: 'Vos informations ont été enregistrées avec succès',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => this.router.navigate(['/getMyprofile']));
        },
        error: (err) => {
          this.isLoading = false;
          const msg =
            err?.error?.error || err?.error?.message || 'Erreur serveur.';
          Toast.fire({ icon: 'error', title: msg });
        },
      });
    });
  }

  get completionPct(): number {
    const fields = [
      'prenom',
      'nom',
      'dateNaissance',
      'num_Tel',
      'adresse',
      'anneesExperience',
      'description',
    ];
    if (this.requiresEtudes) fields.push('specialiteEtude', 'niveauEtude');
    const filled = fields.filter((k) => !!this.f(k).value).length;
    return Math.round((filled / fields.length) * 100);
  }

  get pwStrength(): number {
    const v = this.f('newPassword').value || '';
    if (!v) return 0;
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /\d/.test(v) && /[^a-zA-Z0-9]/.test(v)) s++;
    return s;
  }

  cancel(): void {
    Swal.fire({
      title: 'Annuler les modifications ?',
      text: 'Toutes les modifications non enregistrées seront perdues',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7C3AED',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, rester',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) this.router.navigate(['/getMyprofile']);
    });
  }
}
