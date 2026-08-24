import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';



import { ApplicationDto, StatusChange } from '../../../core/models/Application';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import { Interview } from '../../../core/models/interview';
import {
  ApplicationStatus,
  InterviewType,
  InterviewStatus,
  InterviewResult,
  InterviewMode,
} from '../../../core/models/enums/enumPosteRecrutemnt';
import { ApplyService } from '../../../core/service/apply.service';
import { InterviewService } from '../../../core/service/interview.service';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { ReprogrammerService } from '../../../core/service/reporte-entretient.service';
import { DemandeReportStatus, Reprogrammer } from '../../../core/models/Reprogramme';

@Component({
  selector:
    'app-consulter-etat-ethistorique-par-detaille-dune-candidature-specifique',
  templateUrl:
    './consulter-etat-ethistorique-par-detaille-dune-candidature-specifique.component.html',
  styleUrl:
    './consulter-etat-ethistorique-par-detaille-dune-candidature-specifique.component.css',
})
export class ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent implements OnInit {
  posteId!: string;

  poste: PosteRecrutment | null = null;
  candidature: ApplicationDto | null = null;
  entretiens: Interview[] = [];
  timeline: StatusChange[] = [];

  isLoading = true;
  errorMessage: string | null = null;

  readonly ApplicationStatus = ApplicationStatus;
  demandesParEntretien: { [interviewId: string]: Reprogrammer[] } = {};
  constructor(
    private reprogrammerService: ReprogrammerService,
    private route: ActivatedRoute,
    private router: Router,
    private applyService: ApplyService,
    private posteService: PosteRecutementService,
    private interviewService: InterviewService,
  ) {}

  ngOnInit(): void {
    this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.posteId) {
      this.errorMessage = 'Identifiant de poste manquant.';
      this.isLoading = false;
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      poste: this.posteService.getPosteRecrutementById(this.posteId),
      candidature: this.applyService.getMaCandidaturePourPoste(this.posteId),
    }).subscribe({
      next: ({ poste, candidature }) => {
        this.poste = poste;
        this.candidature = candidature ?? null;

        this.timeline = [...(candidature?.historiqueStatuts ?? [])].sort(
          (a, b) =>
            new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime(),
        );

        if (candidature?.idApplication) {
          this.loadEntretiens(candidature.idApplication);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erreur chargement candidature', err);
        this.errorMessage =
          'Impossible de charger le détail de cette candidature.';
        this.isLoading = false;
      },
    });
  }

  private toDate(interview: Interview): Date {
    if (!interview.interviewDate) return new Date(0);
    return new Date(
      `${interview.interviewDate}T${interview.startTime ?? '00:00'}:00`,
    );
  }

  retour(): void {
    this.router.navigate(['/candidat/MesCandidatures']);
  }

  getStatusLabel(statut?: ApplicationStatus): string {
    const labels: Record<ApplicationStatus, string> = {
      [ApplicationStatus.EN_ATTENTE]: 'En attente',
      [ApplicationStatus.SELECTIONNE]: 'Profil sélectionné',
      [ApplicationStatus.EN_ENTRETIEN_RH]: 'Entretien RH',
      [ApplicationStatus.EN_ENTRETIEN_TECHNIQUE]: 'Entretien technique',
      [ApplicationStatus.EN_ENTRETIEN_FINAL]: 'Entretien final',
      [ApplicationStatus.ACCEPTE]: 'Recruté(e)',
      [ApplicationStatus.REJETE]: 'Non retenue',
      [ApplicationStatus.RETIRE]: 'Retirée',
    };
    return statut ? labels[statut] : 'Statut inconnu';
  }

  getStatusClass(statut?: ApplicationStatus): string {
    switch (statut) {
      case ApplicationStatus.ACCEPTE:
        return 'badge success';
      case ApplicationStatus.REJETE:
      case ApplicationStatus.RETIRE:
        return 'badge muted';
      case ApplicationStatus.EN_ATTENTE:
        return 'badge pending';
      default:
        return 'badge progress';
    }
  }

  getInterviewTypeLabel(type?: InterviewType): string {
    switch (type) {
      case InterviewType.RH_INITIAL:
        return 'Entretien RH Initial';
      case InterviewType.TECHNIQUE:
        return 'Entretien Technique';
      case InterviewType.RH_FINAL:
        return 'Entretien RH Final';
      default:
        return 'Entretien';
    }
  }

  getInterviewStatusLabel(status?: InterviewStatus): string {
    const labels: Record<InterviewStatus, string> = {
      [InterviewStatus.PLANIFIE]: 'Planifié',
      [InterviewStatus.CONFIRME]: 'Confirmé',
      [InterviewStatus.EN_COURS]: 'En cours',
      [InterviewStatus.TERMINE]: 'Terminé',
      [InterviewStatus.ANNULE]: 'Annulé',
      [InterviewStatus.REPORTE]: 'Reporté',
      [InterviewStatus.ABSENT]: 'Absence',
    };
    return status ? labels[status] : '';
  }

  getResultLabel(result?: InterviewResult): string {
    if (result === InterviewResult.REUSSI) return 'Réussi';
    if (result === InterviewResult.ECHOUE) return 'Non concluant';
    return 'En attente de résultat';
  }

  getResultClass(result?: InterviewResult): string {
    if (result === InterviewResult.REUSSI) return 'result-badge success';
    if (result === InterviewResult.ECHOUE) return 'result-badge failed';
    return 'result-badge pending';
  }

  getModeLabel(mode?: InterviewMode): string {
    switch (mode) {
      case InterviewMode.PRESENTIEL:
        return 'Présentiel';
      case InterviewMode.DISTANCIEL:
        return 'Distanciel';
      case InterviewMode.TELEPHONIQUE:
        return 'Téléphonique';
      default:
        return '';
    }
  }

  getModeIcon(mode?: InterviewMode): string {
    switch (mode) {
      case InterviewMode.PRESENTIEL:
        return 'fa-location-dot';
      case InterviewMode.DISTANCIEL:
        return 'fa-video';
      case InterviewMode.TELEPHONIQUE:
        return 'fa-phone';
      default:
        return 'fa-circle-question';
    }
  }

  private loadEntretiens(applicationId: string): void {
    this.interviewService
      .getEntretiensPourCandidature(applicationId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (entretiens) => {
          this.entretiens = [...entretiens].sort(
            (a, b) => this.toDate(a).getTime() - this.toDate(b).getTime(),
          );
          this.entretiens.forEach((e) => e.id && this.loadDemandes(e.id));
        },
        error: (err) => console.error('Erreur chargement entretiens', err),
      });
  }

  private loadDemandes(interviewId: string): void {
    this.reprogrammerService.getPourEntretien(interviewId).subscribe({
      next: (demandes) => (this.demandesParEntretien[interviewId] = demandes),
      error: () => (this.demandesParEntretien[interviewId] = []),
    });
  }

  isActif(interview: Interview): boolean {
    return (
      interview.status === InterviewStatus.PLANIFIE ||
      interview.status === InterviewStatus.REPORTE
    );
  }

  canReprogrammer(interview: Interview): boolean {
    if (!interview.id || !this.isActif(interview)) return false;
    const demandes = this.demandesParEntretien[interview.id] ?? [];
    return !demandes.some(
      (d: Reprogrammer) => d.statut === DemandeReportStatus.EN_ATTENTE,
    );
  }

  demandeEnAttentePour(interview: Interview): Reprogrammer | null {
    const demandes = interview.id
      ? (this.demandesParEntretien[interview.id] ?? [])
      : [];
    return (
      demandes.find(
        (d: Reprogrammer) => d.statut === DemandeReportStatus.EN_ATTENTE,
      ) ?? null
    );
  }

  reprogrammer(interview: Interview): void {
    if (!interview.id) return;
    this.router.navigate(['reprogrammer', interview.id], {
      relativeTo: this.route,
      queryParams: {
        poste: this.poste?.titre ?? '',
        intervenant: interview.interviewerName ?? '',
        ancienneDate:
          interview.interviewDate && interview.startTime
            ? `${interview.interviewDate}T${interview.startTime}:00`
            : '',
      },
    });
  }
}
