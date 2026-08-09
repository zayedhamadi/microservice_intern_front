import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import { ApplicationDto } from '../../../core/models/Application';
import { ApplicationStatus } from '../../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { ApplyService } from '../../../core/service/apply.service';
import { NotificationService } from '../../../core/service/notification.service';

type CvChoiceOption = 'EXISTANT' | 'NOUVEAU';

const CV_FORMATS_ACCEPTES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const TAILLE_MAX_FICHIER = 10 * 1024 * 1024;

@Component({
  selector: 'app-postulera-candidat-specific',
  templateUrl: './postulera-candidat-specific.component.html',
  styleUrl: './postulera-candidat-specific.component.css',
})
export class PostuleraCandidatSpecificComponent implements OnInit {
  readonly ApplicationStatus = ApplicationStatus;

  posteId = '';
  poste: PosteRecrutment | null = null;

  isLoadingPoste = true;
  hasErrorPoste = false;

  isCheckingCandidature = true;
  maCandidature: ApplicationDto | null = null;

  cvChoice: CvChoiceOption = 'EXISTANT';
  lettreMotivationTexte = '';
  selectedCvFile: File | null = null;
  selectedLettrePdf: File | null = null;

  isSubmitting = false;

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
      this.hasErrorPoste = true;
      this.isLoadingPoste = false;
      this.isCheckingCandidature = false;
      return;
    }
    this.loadPoste();
    this.checkCandidatureExistante();
  }

  private loadPoste(): void {
    this.isLoadingPoste = true;
    this.hasErrorPoste = false;

    this.posteRecrutementService.getPosteById(this.posteId).subscribe({
      next: (data: PosteRecrutment) => {
        this.poste = data;
        this.isLoadingPoste = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement poste :', err);
        this.hasErrorPoste = true;
        this.isLoadingPoste = false;
      },
    });
  }

  private checkCandidatureExistante(): void {
    this.isCheckingCandidature = true;
    this.applyService.getMaCandidaturePourPoste(this.posteId).subscribe({
      next: (candidature) => {
        this.maCandidature = candidature ?? null;
        this.isCheckingCandidature = false;
      },
      error: () => {
        this.maCandidature = null;
        this.isCheckingCandidature = false;
      },
    });
  }

  get isReady(): boolean {
    return (
      !this.isLoadingPoste && !this.hasErrorPoste && !this.isCheckingCandidature
    );
  }

  /** Le formulaire s'affiche s'il n'y a pas de candidature active — RETIRE compte comme "pas de candidature". */
  get canShowForm(): boolean {
    return (
      this.isReady &&
      (!this.maCandidature ||
        this.maCandidature.statut === ApplicationStatus.RETIRE)
    );
  }

  /** Candidature active (bloquante) — sert à afficher le bandeau "déjà candidat". */
  get hasCandidatureActive(): boolean {
    return (
      this.isReady &&
      !!this.maCandidature &&
      this.maCandidature.statut !== ApplicationStatus.RETIRE
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
  }

  removeCvFile(input: HTMLInputElement): void {
    this.selectedCvFile = null;
    input.value = '';
  }

  removeLettrePdf(input: HTMLInputElement): void {
    this.selectedLettrePdf = null;
    input.value = '';
  }

  submit(): void {
    if (this.isSubmitting) return;

    if (this.cvChoice === 'NOUVEAU' && !this.selectedCvFile) {
      this.notificationService.toastError(
        'Merci de sélectionner un fichier CV.',
      );
      return;
    }

    this.isSubmitting = true;

    const request$ =
      this.cvChoice === 'EXISTANT'
        ? this.applyService.postulerAvecCvExistant(
            this.posteId,
            this.lettreMotivationTexte.trim() || undefined,
            this.selectedLettrePdf ?? undefined,
          )
        : this.applyService.postulerAvecNouveauCv(
            this.posteId,
            this.selectedCvFile as File,
            this.lettreMotivationTexte.trim() || undefined,
            this.selectedLettrePdf ?? undefined,
          );

    request$.subscribe({
      next: (candidature) => {
        this.isSubmitting = false;
        this.maCandidature = candidature;
        this.notificationService
          .success(
            'Candidature envoyée !',
            'Votre candidature a bien été transmise au recruteur.',
          )
          .then(() => this.goToPosteDetail());
      },
      error: (err: any) => {
        console.error('Erreur lors de la candidature :', err);
        this.isSubmitting = false;
        const message =
          err?.error?.message ?? "Impossible d'envoyer votre candidature.";
        this.notificationService.error('Candidature refusée', message);
      },
    });
  }

  goToPosteDetail(): void {
    this.router.navigate([
      '/candidat/consulterspecifiPosteDisponibless',
      this.posteId,
    ]);
  }
}
