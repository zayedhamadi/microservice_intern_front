import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import {
  PosteEntretiensTechniques,
  CandidatEntretienTechnique,
} from '../../../core/models/poste-entretien-technique';
import { PlanificationCandidatureContext } from '../../../core/models/interview';
import { InterviewService } from '../../../core/service/interview.service';
import { ApplyService } from '../../../core/service/apply.service';
import {
  InterviewStatus,
  InterviewResult,
} from '../../../core/models/enums/enumPosteRecrutemnt';

@Component({
  selector: 'app-liste-users-pour-faire-entretient-technique',
  templateUrl: './liste-users-pour-faire-entretient-technique.component.html',
  styleUrl: './liste-users-pour-faire-entretient-technique.component.css',
})
export class ListeUsersPourFaireEntretientTechniqueComponent implements OnInit {
  postes: PosteEntretiensTechniques[] = [];
  filteredPostes: PosteEntretiensTechniques[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  statusFilter = ''; // '' | 'A_PLANIFIER' | une valeur de InterviewStatus
  expandedPosteId: string | null = null;
  detailsLoadingId: string | null = null;

  readonly InterviewStatus = InterviewStatus;
  readonly InterviewResult = InterviewResult;
  readonly statusOptions = Object.values(InterviewStatus);

  readonly statusLabels: Record<string, string> = {
    [InterviewStatus.PLANIFIE]: 'Planifié',
    [InterviewStatus.CONFIRME]: 'Confirmé',
    [InterviewStatus.EN_COURS]: 'En cours',
    [InterviewStatus.TERMINE]: 'Terminé',
    [InterviewStatus.ANNULE]: 'Annulé',
    [InterviewStatus.REPORTE]: 'Reporté',
    [InterviewStatus.ABSENT]: 'Absent',
  };

  readonly modeLabels: Record<string, string> = {
    PRESENTIEL: 'Présentiel',
    DISTANCIEL: 'Visio / Meet',
    TELEPHONIQUE: 'Téléphonique',
    VISIOCONFERENCE: 'Visio / Meet',
  };

  constructor(
    private interviewService: InterviewService,
    private applyService: ApplyService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.loading = true;
    this.error = '';
    this.interviewService.getEntretiensTechniquesParPoste().subscribe({
      next: (data) => {
        this.postes = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.log(err);

        this.error = 'Impossible de charger les entretiens techniques.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredPostes = this.postes
      .map((poste) => {
        const candidats = poste.candidats.filter((c) => {
          const matchTerm =
            !term ||
            c.candidateName?.toLowerCase().includes(term) ||
            c.candidateEmail?.toLowerCase().includes(term) ||
            poste.posteTitre?.toLowerCase().includes(term);
          const matchStatus =
            !this.statusFilter ||
            (this.statusFilter === 'A_PLANIFIER'
              ? !c.interviewId
              : c.status === this.statusFilter);
          return matchTerm && matchStatus;
        });
        return { ...poste, candidats, nombreCandidats: candidats.length };
      })
      .filter((poste) => poste.candidats.length > 0);
  }

  toggleExpand(posteId: string): void {
    this.expandedPosteId = this.expandedPosteId === posteId ? null : posteId;
  }

  totalCandidats(): number {
    return this.filteredPostes.reduce((sum, p) => sum + p.nombreCandidats, 0);
  }

  trackByPosteId(index: number, poste: PosteEntretiensTechniques): string {
    return poste.posteId;
  }

  statusLabel(status?: string): string {
    if (!status) return 'À planifier';
    return this.statusLabels[status] || status;
  }

  trackByInterviewId(
    index: number,
    candidat: CandidatEntretienTechnique,
  ): string {
    return candidat.interviewId ?? candidat.applicationId;
  }

  statusClass(status?: string): string {
    if (!status) return 'badge badge-a-planifier';
    return 'badge badge-' + status.toLowerCase().replace('_', '-');
  }

  resultatClass(resultat?: string): string {
    if (resultat === InterviewResult.REUSSI) return 'badge badge-reussi';
    if (resultat === InterviewResult.ECHOUE) return 'badge badge-echoue';
    return '';
  }

  aPlanifier(candidat: CandidatEntretienTechnique): boolean {
    return !candidat.interviewId;
  }

  peutSaisirResultat(candidat: CandidatEntretienTechnique): boolean {
    return (
      !!candidat.interviewId &&
      (candidat.status === InterviewStatus.PLANIFIE ||
        candidat.status === InterviewStatus.REPORTE)
    );
  }

  /** Envoie vers le calendrier employé avec le contexte de la candidature à planifier */
  planifier(
    poste: PosteEntretiensTechniques,
    candidat: CandidatEntretienTechnique,
  ): void {
    const context: PlanificationCandidatureContext = {
      applicationId: candidat.applicationId,
      candidateName: candidat.candidateName,
      candidateEmail: candidat.candidateEmail,
      posteRecrutement: poste.posteTitre,
      typeEntretien: 'technique',
    };
    this.router.navigate(['/manager/calendrierEmployee'], {
      state: { planificationCandidature: context },
    });
  }

  /** Ouvre le calendrier centré sur la daterr d'un entretien déjà planifié */
  voirDansCalendrier(candidat: CandidatEntretienTechnique): void {
    this.router.navigate(['/manager/calendrierEmployee'], {
      state: { selectedDate: candidat.interviewDate },
    });
  }

  /** Affiche le commentaire RH et le dernier entretien RH initial (date + mode) */
  voirDetails(
    poste: PosteEntretiensTechniques,
    candidat: CandidatEntretienTechnique,
  ): void {
    this.detailsLoadingId = candidat.applicationId;

    forkJoin({
      candidatures: this.applyService.getCandidaturesPourPoste(poste.posteId),
      entretiens: this.interviewService.getEntretiensPourCandidature(
        candidat.applicationId,
      ),
    }).subscribe({
      next: ({ candidatures, entretiens }) => {
        this.detailsLoadingId = null;

        const application = candidatures.find(
          (a) => a.idApplication === candidat.applicationId,
        );

        const rhInitial = entretiens
          .filter((e) => e.type === 'RH_INITIAL')
          .sort((a, b) =>
            (b.createdAt || '').localeCompare(a.createdAt || ''),
          )[0];

        const commentaireRH = application?.commentaireRH?.trim()
          ? application.commentaireRH
          : 'Aucun commentaire RH.';

        const rhInitialHtml = rhInitial
          ? `
            <p><strong>Date :</strong> ${rhInitial.interviewDate ?? '-'} ${rhInitial.startTime ?? ''}</p>
            <p><strong>Mode :</strong> ${this.modeLabels[rhInitial.mode as string] ?? rhInitial.mode ?? '-'}</p>
            <p><strong>Statut :</strong> ${this.statusLabels[rhInitial.status as string] ?? rhInitial.status ?? '-'}</p>
          `
          : `<p><em>Aucun entretien RH initial trouvé pour cette candidature.</em></p>`;

        Swal.fire({
          title: `Détails — ${candidat.candidateName}`,
          html: `
            <div style="text-align:left">
              <h4>Commentaire RH</h4>
              <p>${commentaireRH}</p>
              <hr/>
              <h4>Dernier entretien RH initial</h4>
              ${rhInitialHtml}
            </div>
          `,
          confirmButtonText: 'Fermer',
        });
      },
      error: (err) => {
        console.log(err);
        console.error(err);
        this.detailsLoadingId = null;
        Swal.fire('Erreur', 'Impossible de charger les détails.', 'error');
      },
    });
  }

  enregistrerResultat(candidat: CandidatEntretienTechnique): void {
    if (!candidat.interviewId) return;

    Swal.fire({
      title: `Résultat — ${candidat.candidateName}`,
      html: `
        <select id="swal-resultat" class="swal2-select">
          <option value="${InterviewResult.REUSSI}">Réussi</option>
          <option value="${InterviewResult.ECHOUE}">Échoué</option>
        </select>
        <textarea id="swal-notes" class="swal2-textarea" placeholder="Notes (obligatoire si échoué)"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const resultat = (
          document.getElementById('swal-resultat') as HTMLSelectElement
        ).value as InterviewResult;
        const notes = (
          document.getElementById('swal-notes') as HTMLTextAreaElement
        ).value.trim();
        if (resultat === InterviewResult.ECHOUE && !notes) {
          Swal.showValidationMessage(
            "Une note est obligatoire lorsque l'entretien est échoué",
          );
          return false;
        }
        return { resultat, notes };
      },
    }).then((res) => {
      if (!res.isConfirmed || !res.value) return;
      this.interviewService
        .enregistrerResultat(candidat.interviewId!, res.value)
        .subscribe({
          next: () => {
            Swal.fire('Enregistré', 'Le résultat a été enregistré.', 'success');
            this.chargerDonnees();
          },
          error: (err: any) => {
            console.log(err)
            Swal.fire(
              'Erreur',
              "Impossible d'enregistrer le résultat.",
              'error',
            )},
        });
    });
  }
}
