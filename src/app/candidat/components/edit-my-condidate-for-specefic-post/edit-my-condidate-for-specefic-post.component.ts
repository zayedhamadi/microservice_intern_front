import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import { ApplicationDto } from '../../../core/models/Application';
import { ApplicationStatus } from '../../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { ApplyService } from '../../../core/service/apply.service';
import { NotificationService } from '../../../core/service/notification.service';

const CV_FORMATS_ACCEPTES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const TAILLE_MAX_FICHIER = 10 * 1024 * 1024;

@Component({
  selector: 'app-edit-my-condidate-for-specefic-post',
  templateUrl: './edit-my-condidate-for-specefic-post.component.html',
  styleUrl: './edit-my-condidate-for-specefic-post.component.css',
})
export class EditMyCondidateForSpeceficPostComponent implements OnInit {
  readonly ApplicationStatus = ApplicationStatus;

  posteId = '';
  poste: PosteRecrutment | null = null;
  maCandidature: ApplicationDto | null = null;

  isLoading = true;
  hasError = false;

  lettreMotivationTexte = '';
  selectedCvFile: File | null = null;
  selectedLettrePdf: File | null = null;
  supprimerLettrePdfExistante = false;

  isSubmitting = false;
  isRetraitEnCours = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private posteRecrutementService: PosteRecutementService,
    private applyService: ApplyService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.posteId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.posteRecrutementService.getPosteById(this.posteId).subscribe({
      next: (poste) => {
        this.poste = poste;
        this.applyService.getMaCandidaturePourPoste(this.posteId).subscribe({
          next: (candidature) => {
            if (!candidature) {
              this.hasError = true;
              this.isLoading = false;
              return;
            }
            this.maCandidature = candidature;
            this.lettreMotivationTexte =
              candidature.lettreMotivationTexte ?? '';
            this.isLoading = false;
          },
          error: () => {
            this.hasError = true;
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  get canEdit(): boolean {
    return this.maCandidature?.statut === ApplicationStatus.EN_ATTENTE;
  }

  get canRetirer(): boolean {
    if (!this.maCandidature) return false;
    const statutsRetirables = new Set([
      ApplicationStatus.EN_ATTENTE,
      ApplicationStatus.SELECTIONNE,
      ApplicationStatus.EN_ENTRETIEN_RH,
      ApplicationStatus.EN_ENTRETIEN_TECHNIQUE,
      ApplicationStatus.EN_ENTRETIEN_FINAL,
    ]);
    return statutsRetirables.has(
      this.maCandidature.statut as ApplicationStatus,
    );
  }

  onCvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !CV_FORMATS_ACCEPTES.includes(file.type)) {
      this.notificationService.toastError('Formats acceptés : PDF, DOC, DOCX');
      input.value = '';
      return;
    }
    if (file && file.size > TAILLE_MAX_FICHIER) {
      this.notificationService.toastError('Le CV ne doit pas dépasser 10 Mo');
      input.value = '';
      return;
    }
    this.selectedCvFile = file;
  }

  onLettrePdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && file.type !== 'application/pdf') {
      this.notificationService.toastError(
        'La lettre de motivation doit être un fichier PDF',
      );
      input.value = '';
      return;
    }
    if (file && file.size > TAILLE_MAX_FICHIER) {
      this.notificationService.toastError(
        'La lettre de motivation ne doit pas dépasser 10 Mo',
      );
      input.value = '';
      return;
    }
    this.selectedLettrePdf = file;
    this.supprimerLettrePdfExistante = false;
  }

  removeCvFile(input: HTMLInputElement): void {
    this.selectedCvFile = null;
    input.value = '';
  }

  removeNewLettrePdf(input: HTMLInputElement): void {
    this.selectedLettrePdf = null;
    input.value = '';
  }

  supprimerLettreExistante(): void {
    this.supprimerLettrePdfExistante = true;
  }

  annulerSuppressionLettreExistante(): void {
    this.supprimerLettrePdfExistante = false;
  }

  submit(): void {
    if (!this.maCandidature?.idApplication || this.isSubmitting) return;

    this.isSubmitting = true;
    this.applyService
      .modifierCandidature(
        this.maCandidature.idApplication,
        this.lettreMotivationTexte.trim() || undefined,
        this.selectedCvFile ?? undefined,
        this.selectedLettrePdf ?? undefined,
        this.supprimerLettrePdfExistante,
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService
            .success(
              'Candidature mise à jour',
              'Vos modifications ont bien été enregistrées.',
            )
            .then(() => this.goToPosteDetail());
        },
        error: (err) => {
          this.isSubmitting = false;
          const message =
            err?.error?.message ?? 'Impossible de modifier votre candidature.';
          this.notificationService.error('Modification refusée', message);
        },
      });
  }

  retirerCandidature(): void {
    if (!this.maCandidature?.idApplication || this.isRetraitEnCours) return;

    this.isRetraitEnCours = true;
    this.applyService
      .retirerCandidature(this.maCandidature.idApplication)
      .subscribe({
        next: () => {
          this.isRetraitEnCours = false;
          this.notificationService
            .success(
              'Candidature retirée',
              'Vous pouvez repostuler à ce poste quand vous le souhaitez.',
            )
            .then(() => this.goToPosteDetail());
        },
        error: () => {
          this.isRetraitEnCours = false;
          this.notificationService.toastError(
            'Impossible de retirer la candidature.',
          );
        },
      });
  }

  goToPosteDetail(): void {
    this.router.navigate([
      '/candidat/consulterspecifiPosteDisponibless',
      this.posteId,
    ]);
  }

  getCandidatureStatusLabel(status?: ApplicationStatus): string {
    const labels: Partial<Record<ApplicationStatus, string>> = {
      [ApplicationStatus.EN_ATTENTE]: 'En attente',
      [ApplicationStatus.SELECTIONNE]: 'Profil sélectionné',
      [ApplicationStatus.EN_ENTRETIEN_RH]: 'Entretien RH',
      [ApplicationStatus.EN_ENTRETIEN_TECHNIQUE]: 'Entretien technique',
      [ApplicationStatus.EN_ENTRETIEN_FINAL]: 'Entretien final',
      [ApplicationStatus.ACCEPTE]: 'Recruté(e) 🎉',
      [ApplicationStatus.REJETE]: 'Non retenue',
      [ApplicationStatus.RETIRE]: 'Retirée',
    };
    return status ? (labels[status] ?? '') : '';
  }
}
