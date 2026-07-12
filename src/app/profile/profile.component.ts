import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  UserCommonProfile,
  UserFullProfile,
} from '../core/models/userConneccted';
import { UserService } from '../core/service/user.service';
import { CertificationService } from '../core/service/certification.service';
import { CertificationDTO } from '../core/models/CertificationDTO';
import { NotificationService } from '../core/service/notification.service';

type ProfileTab = 'profil' | 'etudes' | 'cv' | 'certifications' | 'position';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: UserCommonProfile | null = null;
  fullProfile: UserFullProfile | null = null;
  certifications: CertificationDTO[] = [];
  filteredCertifications: CertificationDTO[] = [];

  isLoading = true;
  hasError = false;
  isLoadingCertifs = false;

  activeTab: ProfileTab = 'profil';

  // --- Certification form & modals ---
  certifForm!: FormGroup;
  showAddModal = false;
  showEditModal = false;
  isSaving = false;
  isDeleting = false;
  saveError = '';
  editingCertif: CertificationDTO | null = null;

  // --- CV modal (aperçu plein écran) ---
  showCvModal = false;

  // --- Search & pagination ---
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly certificationService: CertificationService,
    private readonly router: Router,
    private readonly notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.certifForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      dateCertif: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      pdfBase64: [''],
    });

    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: UserCommonProfile) => {
          this.user = data;
          this.isLoading = false;
          if (this.isOrganisationalRole()) this.loadFullProfile();
        },
        error: (err: any) => {
          console.error(err);
          this.isLoading = false;
          this.hasError = true;
        },
      });

    this.loadCertifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToUpdateProfil(): void {
    this.router.navigate(['/updateMyProfil']);
  }

  private loadFullProfile(): void {
    this.userService
      .getMyFullProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (full: UserFullProfile) => (this.fullProfile = full),
        error: (err: any) => console.error('Erreur full profile', err),
      });
  }

  loadCertifications(): void {
    this.isLoadingCertifs = true;
    this.certificationService
      .getMyCertifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (certifs) => {
          this.certifications = certifs;
          this.applyFilter();
          this.isLoadingCertifs = false;
        },
        error: () => (this.isLoadingCertifs = false),
      });
  }

  isOrganisationalRole(): boolean {
    return this.user?.role === 'RH' || this.user?.role === 'EMPLOYEE';
  }

  isCandidat(): boolean {
    return this.user?.role === 'CANDIDAT';
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  get u(): UserCommonProfile {
    return this.user!;
  }

  get avatarSrc(): string | null {
    if (!this.user?.imageBase64) return null;
    return this.user.imageBase64.startsWith('data:')
      ? this.user.imageBase64
      : `data:image/jpeg;base64,${this.user.imageBase64}`;
  }

  // ==================== CV ====================

  get hasCv(): boolean {
    return !!this.user?.cvBase64;
  }

  get cvSrc(): string | null {
    if (!this.user?.cvBase64) return null;
    return this.user.cvBase64.startsWith('data:')
      ? this.user.cvBase64
      : `data:application/pdf;base64,${this.user.cvBase64}`;
  }

  openCvModal(): void {
    if (!this.hasCv) return;
    this.showCvModal = true;
  }

  closeCvModal(): void {
    this.showCvModal = false;
  }

  downloadCv(): void {
    if (!this.cvSrc || !this.user) return;
    const link = document.createElement('a');
    link.href = this.cvSrc;
    link.download = `CV_${this.user.prenom}_${this.user.nom}.pdf`;
    link.click();
  }

  // ==================== CERTIFICATIONS : recherche & pagination ====================

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCertifications = term
      ? this.certifications.filter((c) => c.titre.toLowerCase().includes(term))
      : [...this.certifications];
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  get paginatedCertifs(): CertificationDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCertifications.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCertifications.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  // ==================== CERTIFICATIONS : CRUD ====================

  downloadCertif(certif: CertificationDTO): void {
    if (!certif.pdfBase64) return;
    const href = certif.pdfBase64.startsWith('data:')
      ? certif.pdfBase64
      : `data:application/pdf;base64,${certif.pdfBase64}`;
    const link = document.createElement('a');
    link.href = href;
    link.download = `${certif.titre}.pdf`;
    link.click();
  }

  openAddModal(): void {
    this.certifForm.reset({
      titre: '',
      description: '',
      dateCertif: '',
      pdfBase64: '',
    });
    this.saveError = '';
    this.editingCertif = null;
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.saveError = '';
  }

  openEditModal(certif: CertificationDTO): void {
    this.editingCertif = certif;
    this.certifForm.patchValue({
      titre: certif.titre,
      dateCertif: certif.dateCertif,
      description: certif.description,
      pdfBase64: '',
    });
    this.saveError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingCertif = null;
    this.saveError = '';
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.saveError = 'Seuls les fichiers PDF sont autorisés.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.saveError = 'Le fichier PDF ne doit pas dépasser 5 Mo.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.certifForm.patchValue({ pdfBase64: reader.result as string });
      this.saveError = '';
    };
    reader.readAsDataURL(file);
  }

  onPdfDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file?.type === 'application/pdf') {
      const fakeEvt = { target: { files: [file] } } as unknown as Event;
      this.onPdfSelected(fakeEvt);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  isFormValid(): boolean {
    return (
      this.certifForm.controls['titre'].valid &&
      this.certifForm.controls['dateCertif'].valid
    );
  }

  get pdfBase64Value(): string {
    return this.certifForm.get('pdfBase64')?.value ?? '';
  }

  saveCertif(): void {
    if (!this.isFormValid() || this.isSaving) return;
    this.isSaving = true;
    this.saveError = '';

    const dto: Partial<CertificationDTO> = {
      titre: this.certifForm.value.titre,
      dateCertif: this.certifForm.value.dateCertif,
      description: this.certifForm.value.description,
      pdfBase64: this.certifForm.value.pdfBase64 || undefined,
    };

    this.certificationService
      .addCertification(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created: CertificationDTO) => {
          this.certifications.unshift(created);
          this.applyFilter();
          this.isSaving = false;
          this.closeAddModal();
          this.notification.toastSuccess('Certification ajoutée');
        },
        error: (err) => {
          this.saveError =
            err?.error?.error || "Erreur lors de l'ajout. Veuillez réessayer.";
          this.isSaving = false;
        },
      });
  }

  updateCertif(): void {
    if (!this.isFormValid() || this.isSaving || !this.editingCertif) return;
    this.isSaving = true;
    this.saveError = '';

    const dto: Partial<CertificationDTO> = {
      titre: this.certifForm.value.titre,
      dateCertif: this.certifForm.value.dateCertif,
      description: this.certifForm.value.description,
    };
    if (this.certifForm.value.pdfBase64) {
      dto.pdfBase64 = this.certifForm.value.pdfBase64;
    }

    this.certificationService
      .updateCertification(this.editingCertif.idCertification, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated: CertificationDTO) => {
          const idx = this.certifications.findIndex(
            (c) => c.idCertification === updated.idCertification,
          );
          if (idx !== -1) this.certifications[idx] = updated;
          this.applyFilter();
          this.isSaving = false;
          this.closeEditModal();
          this.notification.toastSuccess('Certification mise à jour');
        },
        error: (err) => {
          this.saveError =
            err?.error?.error || 'Erreur lors de la modification.';
          this.isSaving = false;
        },
      });
  }

  async deleteCertif(certif: CertificationDTO): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Supprimer cette certification ?',
      `« ${certif.titre} » sera supprimée définitivement.`,
      'Supprimer',
    );
    if (!confirmed) return;

    this.isDeleting = true;
    this.certificationService
      .deleteCertification(certif.idCertification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.certifications = this.certifications.filter(
            (c) => c.idCertification !== certif.idCertification,
          );
          this.applyFilter();
          this.isDeleting = false;
          this.notification.toast('info', 'Certification supprimée');
        },
        error: () => {
          this.isDeleting = false;
          this.notification.toastError('Erreur lors de la suppression');
        },
      });
  }
}
