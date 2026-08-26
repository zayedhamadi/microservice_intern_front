import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { CertificationDTO } from '../../../core/models/CertificationDTO';
import { CertificationService } from '../../../core/service/certification.service';
import { UserService } from '../../../core/service/user.service';
import { CessationService } from '../../../core/service/cessation.service';
import { NotificationService } from '../../../core/service/notification.service';
import { UserDetailFullResponse } from '../../../core/models/UserDetailFullResponse';
import { switchMap } from 'rxjs/operators';
export type UserDetailRH = UserDetailFullResponse;

@Component({
  selector: 'app-consulter-user-by-admin',
  templateUrl: './consulter-user-by-admin.component.html',
  styleUrl: './consulter-user-by-admin.component.css',
})
export class ConsulterUserByAdminComponent implements OnInit, OnDestroy {
  user: UserDetailRH | null = null;
  userId!: number;
  activeTab: 'infos' | 'pro' | 'certifs' | 'cessation' = 'infos';
  isLoading = true;

  certPage = 1;
  readonly CERT_PAGE_SIZE = 3;

  showCertModal = false;
  selectedCert: CertificationDTO | null = null;

  private readonly destroy$ = new Subject<void>();

  private readonly roleIcons: Record<string, string> = {
    RH: 'fa-user-tie',
    EMPLOYEE: 'fa-user',
    CANDIDAT: 'fa-user-graduate',
  };

  private readonly roleColors: Record<string, string> = {
    RH: '#0d9488',
    EMPLOYEE: '#2563eb',
    CANDIDAT: '#d97706',
  };

  private static readonly LIST_ROUTE = '/manager/listUsersManager';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cessationService: CessationService,
    private readonly certificationService: CertificationService,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly sanitizer: DomSanitizer,
    private readonly notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadUserFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserFromRoute(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        const id = this.parseUserId(params.get('id'));
        if (id !== null) {
          this.loadUserDetails(id);
        } else {
          this.handleInvalidId();
        }
      },
      error: (err: any) => {
        console.error('[ConsulterUserByAdmin] Erreur pipeline de route :', err);
      },
    });
  }

  private parseUserId(idParam: string | null): number | null {
    if (!idParam) return null;
    const id = Number(idParam);
    return !isNaN(id) && id > 0 ? id : null;
  }

  private handleInvalidId(): void {
    this.isLoading = false;
    this.notification.toastError('Identifiant utilisateur invalide');
    this.router.navigate([ConsulterUserByAdminComponent.LIST_ROUTE]);
  }

  private loadUserDetails(id: number): void {
    this.isLoading = true;
    this.userId = id;
    this.certPage = 1;

    forkJoin({
      user: this.userService.getUserByIddAdmin(id),
      certifications: this.certificationService.getCertificationsssByUserId(id),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ user, certifications }) => {
          this.user = this.normalizeUserData({
            ...user,
            certifications: certifications || [],
          });
          this.isLoading = false;
        },
        (error: any) => {
          console.log(error);
          console.error('Erreur:', error);
          this.user = null;
          this.isLoading = false;
          this.notification.toastError('Impossible de charger le profil');
          this.router.navigate([ConsulterUserByAdminComponent.LIST_ROUTE]);
        },
      );
  }
  private normalizeUserData(data: UserDetailFullResponse): UserDetailRH {
    return {
      ...data,
      prenom: data.prenom || '',
      nom: data.nom || '',
      email: data.email || '',
      role: data.role || 'EMPLOYEE',
      etatCompte: data.etatCompte || 'ACTIF',
      genre: data.genre || null,
      anneesExperience: data.anneesExperience ?? 0,
      certifications: data.certifications || [],
    };
  }

  certGoTo(page: number): void {
    if (page < 1 || page > this.certTotalPages) return;
    this.certPage = page;
  }

  openViewCert(cert: CertificationDTO): void {
    this.selectedCert = cert;
    this.showCertModal = true;
  }

  closeCertModal(): void {
    this.showCertModal = false;
    this.selectedCert = null;
  }

  downloadCertification(cert: CertificationDTO): void {
    if (!cert.pdfBase64) {
      this.notification.toast(
        'warning',
        'Aucun PDF disponible pour cette certification',
      );
      return;
    }
    try {
      const href = cert.pdfBase64.startsWith('data:')
        ? cert.pdfBase64
        : `data:application/pdf;base64,${cert.pdfBase64}`;
      const link = document.createElement('a');
      link.href = href;
      link.download = `${cert.titre || 'certification'}.pdf`;
      link.click();
      this.notification.toastSuccess('Téléchargement lancé');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      this.notification.toastError(
        'Impossible de télécharger la certification',
      );
    }
  }

  // =======================================
  // MODALE CESSATION (VERSION PRO)
  // =======================================
  async openCesserModal(): Promise<void> {
    if (!this.user) return;

    const initials = this.getInitials(this.user);
    const roleColor = this.getRoleColor(this.user.role);

    const result = await Swal.fire({
      title: '<div class="modal-title">Cesser ce compte ?</div>',
      html: `
      <div class="modal-subtitle">
        Cette action désactivera <strong>définivement</strong> l'accès de l'utilisateur à la plateforme.
      </div>

      <div class="modal-user-card">
        <div class="modal-avatar" style="background:${roleColor}">${initials}</div>
        <div>
          <div class="modal-user-name">${this.user.prenom} ${this.user.nom}</div>
          <div class="modal-user-email">${this.user.email}</div>
        </div>
      </div>

      <div class="cessation-warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div class="cessation-warning-content">
          <strong>Attention</strong> : Une réactivation manuelle sera nécessaire pour redonner l'accès.
          <br>Les données seront conservées.
        </div>
      </div>

      <div class="modal-field">
        <label class="modal-label">
          Motif de la cessation <span class="required">*</span>
        </label>
        <textarea id="swal-cesser-motif" class="modal-textarea"
          placeholder="Ex : Fin de contrat, démission, faute grave, départ à la retraite..."
          rows="5" maxlength="500"></textarea>
        <div class="modal-char-count"><span id="cm-char-counter">0</span> / 500 caractères</div>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText:
        '<i class="fa-solid fa-user-slash"></i> Confirmer la cessation',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'swal2-popup',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
      },
      didOpen: () => {
        const textarea = document.getElementById(
          'swal-cesser-motif',
        ) as HTMLTextAreaElement;
        const counter = document.getElementById('cm-char-counter');
        textarea?.addEventListener('input', () => {
          if (counter) counter.textContent = String(textarea.value.length);
        });
        textarea?.focus();
      },
      preConfirm: () => {
        const motif = (
          document.getElementById('swal-cesser-motif') as HTMLTextAreaElement
        )?.value?.trim();
        if (!motif) {
          Swal.showValidationMessage('Le motif est obligatoire');
          return false;
        }
        if (motif.length < 10) {
          Swal.showValidationMessage('Minimum 10 caractères requis');
          return false;
        }
        return motif;
      },
    });

    if (result.isConfirmed && result.value) {
      this.cesserUser(result.value);
    }
  }

  // =======================================
  // MODALE RÉACTIVATION (VERSION PRO)
  // =======================================
  async openReactiverModal(): Promise<void> {
    if (!this.user) return;

    const initials = this.getInitials(this.user);
    const roleColor = this.getRoleColor(this.user.role);

    const result = await Swal.fire({
      title: '<div class="modal-title">Réactiver ce compte ?</div>',
      html: `
      <div class="modal-subtitle">
        L'utilisateur retrouvera <strong>immédiatement</strong> l'accès à la plateforme avec toutes ses données intactes.
      </div>

      <div class="modal-user-card">
        <div class="modal-avatar" style="background:${roleColor}">${initials}</div>
        <div>
          <div class="modal-user-name">${this.user.prenom} ${this.user.nom}</div>
          <div class="modal-user-email">${this.user.email}</div>
        </div>
      </div>

      <div class="reactivation-confirmation">
        <i class="fa-solid fa-circle-check"></i>
        <div class="reactivation-confirmation-content">
          <strong>Confirmation</strong> : Toutes les données et permissions seront restaurées.
        </div>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText:
        '<i class="fa-solid fa-user-check"></i> Confirmer la réactivation',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'swal2-popup',
        confirmButton: 'swal2-confirm reactivation-btn',
        cancelButton: 'swal2-cancel',
      },
    });

    if (result.isConfirmed) {
      this.reactiverUser();
    }
  }
  private cesserUser(motif: string): void {
    this.cessationService
      .cesserUser(this.userId, motif)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.toastSuccess('Compte désactivé avec succès');
          this.loadUserDetails(this.userId);
        },

        error: (error) => {
          console.log(error);
          console.error('Erreur cessation:', error);
          this.notification.toastError('Échec de la désactivation du compte');
        },
      });
  }

  private reactiverUser(): void {
    this.cessationService
      .reactiverUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.toastSuccess('Compte réactivé avec succès');
          this.loadUserDetails(this.userId);
        },
        error: (error) => {
          console.log(error);
          console.error('Erreur réactivation:', error);
          this.notification.toastError('Échec de la réactivation du compte');
        },
      });
  }

  backToList(): void {
    this.router.navigate([ConsulterUserByAdminComponent.LIST_ROUTE]);
  }

  getRoleColor(role: string | undefined | null): string {
    if (!role) return '#6366f1';
    return this.roleColors[role] ?? '#6366f1';
  }

  getRoleIcon(role: string | undefined | null): string {
    if (!role) return 'fa-user';
    return this.roleIcons[role] ?? 'fa-user';
  }

  getNormalizedRole(role: string | undefined | null): string {
    return role ? role.toUpperCase() : 'UTILISATEUR';
  }

  getInitials(
    user: { prenom?: string | null; nom?: string | null } | null | undefined,
  ): string {
    if (!user) return '?';
    return (
      (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '')
    ).toUpperCase();
  }

  sanitizeImage(src: string | null | undefined): SafeUrl {
    if (!src) return this.sanitizer.bypassSecurityTrustUrl('');
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  handleImageError(): void {
    if (this.user) this.user.image = null;
  }

  getAnciennete(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const start = new Date(dateStr);
    const now = new Date();
    const months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (months < 1) return '< 1 mois';
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0) return `${months} mois`;
    return rem === 0
      ? `${years} an${years > 1 ? 's' : ''}`
      : `${years} an${years > 1 ? 's' : ''} ${rem} mois`;
  }

  getCompletionPct(): number {
    if (!this.user) return 0;
    const fields = [
      this.user.prenom,
      this.user.nom,
      this.user.genre,
      this.user.numTel,
      this.user.adresse,
      this.user.dateNaissance,
      this.user.description,
      this.user.image,
    ].filter((f) => f !== null && f !== undefined && f !== '');
    return Math.round((fields.length / 8) * 100);
  }

  getCompletionDash(): string {
    const circumference = 2 * Math.PI * 20;
    const pct = this.getCompletionPct() / 100;
    return `${circumference * pct} ${circumference * (1 - pct)}`;
  }

  getCompletionColor(): string {
    const pct = this.getCompletionPct();
    if (pct >= 80) return '#7c3aed';
    if (pct >= 50) return '#a78bfa';
    return '#c4b5fd';
  }

  hasCertifications(): boolean {
    return (this.user?.certifications?.length ?? 0) > 0;
  }

  isAccountActive(): boolean {
    return this.user?.etatCompte === 'ACTIF';
  }

  isAccountInactive(): boolean {
    return this.user?.etatCompte === 'INACTIF';
  }

  // 👇 Ajoutez ces 4 méthodes (pagedCertifications + les autres getters pour la pagination)
  get pagedCertifications(): CertificationDTO[] {
    if (!this.user?.certifications) return [];
    const start = (this.certPage - 1) * this.CERT_PAGE_SIZE;
    return this.user.certifications.slice(start, start + this.CERT_PAGE_SIZE);
  }

  get certTotalPages(): number {
    return Math.max(
      1,
      Math.ceil((this.user?.certifications?.length ?? 0) / this.CERT_PAGE_SIZE),
    );
  }

  get certPages(): number[] {
    return Array.from({ length: this.certTotalPages }, (_, i) => i + 1);
  }

  get certRangeStart(): number {
    return (this.certPage - 1) * this.CERT_PAGE_SIZE + 1;
  }

  get certRangeEnd(): number {
    return Math.min(
      this.certPage * this.CERT_PAGE_SIZE,
      this.user?.certifications?.length ?? 0,
    );
  }
}
