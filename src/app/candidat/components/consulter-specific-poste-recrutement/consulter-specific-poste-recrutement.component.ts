import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import {
  StatusPosteRecrutement,
  WorkType,
  ApplicationStatus,
} from '../../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import { ApplicationDto } from '../../../core/models/Application';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { ApplyService } from '../../../core/service/apply.service';
import { NotificationService } from '../../../core/service/notification.service';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-consulter-specific-poste-recrutement',
  templateUrl: './consulter-specific-poste-recrutement.component.html',
  styleUrl: './consulter-specific-poste-recrutement.component.css',
})
export class ConsulterSpecificPosteRecrutementComponent implements OnInit {
 
 get canApply(): boolean {
    return (
      this.isCandidat &&
      !!this.poste &&
      this.poste.status === StatusPosteRecrutement.OUVERT &&
      !this.isExpired() &&
      !this.maCandidature
    );
  }

  get canEditCandidature(): boolean {
    return this.maCandidature?.statut === ApplicationStatus.EN_ATTENTE;
  }

  get canRepostuler(): boolean {
    return this.maCandidature?.statut === ApplicationStatus.RETIRE;
  }

 
 
 
 
 
  poste: PosteRecrutment | null = null;
  posteId = '';

  isLoading = true;
  hasError = false;

  readonly ApplicationStatus = ApplicationStatus;
  readonly StatusPosteRecrutement = StatusPosteRecrutement;

  isCandidat = false;

  maCandidature: ApplicationDto | null = null;
  isLoadingCandidature = false;
  isRetraitEnCours = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private posteRecrutementService: PosteRecutementService,
    private applyService: ApplyService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {
    this.isCandidat = this.authService.getRole() === 'CANDIDAT';
  }

  ngOnInit(): void {
    this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.posteId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.loadPoste();
    if (this.isCandidat) {
      this.loadMaCandidature();
    }
  }

  loadPoste(): void {
    this.isLoading = true;
    this.hasError = false;

    this.posteRecrutementService.getPosteById(this.posteId).subscribe({
      next: (data: PosteRecrutment) => {
        this.poste = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement poste :', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  loadMaCandidature(): void {
    this.isLoadingCandidature = true;
    this.applyService.getMaCandidaturePourPoste(this.posteId).subscribe({
      next: (candidature) => {
        this.maCandidature = candidature ?? null;
        this.isLoadingCandidature = false;
      },
      error: () => {
        // Le backend renvoie 204 (pas de body) s'il n'y a pas de candidature :
        // ce n'est pas une erreur, juste l'absence de candidature.
        this.maCandidature = null;
        this.isLoadingCandidature = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  /** Redirige vers la page dédiée de candidature (route: postulerAunePosteSpecific/:id). */
  goToApplyPage(): void {
    this.router.navigate(['/candidat/postulerAunePosteSpecific', this.posteId]);
  }

  retirerCandidature(): void {
    if (!this.maCandidature?.idApplication || this.isRetraitEnCours) return;

    this.isRetraitEnCours = true;
    this.applyService
      .retirerCandidature(this.maCandidature.idApplication)
      .subscribe({
        next: () => {
          this.isRetraitEnCours = false;
          this.maCandidature = null;
          this.notificationService.toastSuccess('Candidature retirée.');
        },
        error: (err) => {
          console.error('Erreur lors du retrait :', err);
          this.isRetraitEnCours = false;
          this.notificationService.toastError(
            'Impossible de retirer la candidature.',
          );
        },
      });
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

  getStatusBadgeClass(status?: StatusPosteRecrutement): string {
    switch (status) {
      case StatusPosteRecrutement.OUVERT:
        return 'badge-status ouvert';
      case StatusPosteRecrutement.EXPIRE:
        return 'badge-status expire';
      case StatusPosteRecrutement.FERME:
        return 'badge-status ferme';
      default:
        return 'badge-status';
    }
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

  getCandidatureStatusClass(status?: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.ACCEPTE:
        return 'candidature-badge success';
      case ApplicationStatus.REJETE:
      case ApplicationStatus.RETIRE:
        return 'candidature-badge muted';
      case ApplicationStatus.EN_ATTENTE:
        return 'candidature-badge pending';
      default:
        return 'candidature-badge progress';
    }
  }

  getWorkTypeIcon(workType?: WorkType): string {
    switch (workType) {
      case WorkType.SUR_SITE:
        return 'fa-building';
      case WorkType.HYBRIDE:
        return 'fa-shuffle';
      case WorkType.DISTANCE:
        return 'fa-house-laptop';
      default:
        return 'fa-briefcase';
    }
  }

  getDeptInitial(nom?: string): string {
    return nom?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  }

  isExpiringSoon(): boolean {
    if (!this.poste?.dateExpirationPosteRecrutement) return false;
    const diffDays =
      (new Date(this.poste.dateExpirationPosteRecrutement).getTime() -
        Date.now()) /
      (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 5;
  }

  isExpired(): boolean {
    if (!this.poste?.dateExpirationPosteRecrutement) return false;
    return (
      new Date(this.poste.dateExpirationPosteRecrutement).getTime() < Date.now()
    );
  }

  daysAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diffDays = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays <= 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  }
}
