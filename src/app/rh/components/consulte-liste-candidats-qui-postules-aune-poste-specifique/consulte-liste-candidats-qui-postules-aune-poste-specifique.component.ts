import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { firstValueFrom, Subject } from 'rxjs';

import { ApplyService } from '../../../core/service/apply.service';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { InterviewService } from '../../../core/service/interview.service';
import { ApplicationDto } from '../../../core/models/Application';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import {
  ApplicationStatus,
  InterviewResult,
} from '../../../core/models/enums/enumPosteRecrutemnt';
import {
  LABELS_STATUT,
  TRANSITIONS_POSSIBLES,
} from '../../../core/constant/selectPoste';
import {
  PlanificationCandidatureContext,
  RecrutementInterviewType,
} from '../../../core/service/recrutement-interview.service';

type SortField = 'score' | 'date' | 'nom';
type SortDir = 'asc' | 'desc';

interface StatutOption {
  valeur: ApplicationStatus;
  label: string;
}

const STATUTS_RESERVES_WORKFLOW_ENTRETIEN: ApplicationStatus[] = [
  ApplicationStatus.EN_ENTRETIEN_RH,
  ApplicationStatus.EN_ENTRETIEN_TECHNIQUE,
  ApplicationStatus.EN_ENTRETIEN_FINAL,
];

function typeEntretienPourStatutCourant(
  statut: ApplicationStatus,
): RecrutementInterviewType | undefined {
  switch (statut) {
    case ApplicationStatus.SELECTIONNE:
    case ApplicationStatus.EN_ENTRETIEN_RH:
      return 'rh-initial';
    case ApplicationStatus.EN_ENTRETIEN_TECHNIQUE:
      return 'technique';
    case ApplicationStatus.EN_ENTRETIEN_FINAL:
      return 'rh-final';
    default:
      return undefined;
  }
}

function typeBackendPourTypeUi(typeUi: RecrutementInterviewType): string {
  switch (typeUi) {
    case 'rh-initial':
      return 'RH_INITIAL';
    case 'technique':
      return 'TECHNIQUE';
    case 'rh-final':
      return 'RH_FINAL';
  }
}

@Component({
  selector: 'app-consulte-liste-candidats-qui-postules-aune-poste-specifique',
  templateUrl:
    './consulte-liste-candidats-qui-postules-aune-poste-specifique.component.html',
  styleUrl:
    './consulte-liste-candidats-qui-postules-aune-poste-specifique.component.css',
})
export class ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent
  implements OnInit, OnDestroy
{
  readonly statutOptions: StatutOption[] = Object.values(ApplicationStatus).map(
    (v) => ({
      valeur: v,
      label: LABELS_STATUT[v],
    }),
  );

  readonly ApplicationStatus = ApplicationStatus;
  posteId = '';
  poste: PosteRecrutment | null = null;

  candidatures: ApplicationDto[] = [];
  candidaturesAffichees: ApplicationDto[] = [];
  candidaturesFiltrees: ApplicationDto[] = [];

  isLoading = false;
  isLoadingPoste = false;
  errorMessage = '';
  candidatureEnCoursDeMaj: string | null = null;

  searchTerm = '';
  statutSelectionne = '';
  scoreMinimum = 0;

  sortBy: SortField = 'score';
  sortDir: SortDir = 'desc';

  pageActuelle = 1;
  elementsParPage = 6;

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly applyService: ApplyService,
    private readonly posteService: PosteRecutementService,
    private readonly interviewService: InterviewService,
  ) {}

  chargerCandidatures(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.applyService.getCandidaturesClasseesPourPoste(this.posteId).subscribe({
      next: (candidatures) => {
        this.candidatures = candidatures;
        this.appliquerFiltresEtTri();
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.log('Erreur lors du chargement des candidatures :', error);
        this.errorMessage =
          'Impossible de charger les candidatures pour ce poste. Réessayez.';
        this.isLoading = false;
      },
    });
  }

  ngOnInit(): void {
    this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.posteId) {
      this.errorMessage = 'Identifiant de poste manquant.';
      return;
    }

    this.chargerPoste();
    this.chargerCandidatures();

    this.searchChange$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageActuelle = 1;
        this.appliquerFiltresEtTri();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  chargerPoste(): void {
    this.isLoadingPoste = true;
    this.posteService.getPosteById(this.posteId).subscribe({
      next: (poste) => {
        this.poste = poste;
        this.isLoadingPoste = false;
      },
      error: () => {
        this.isLoadingPoste = false;
      },
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchChange$.next(value);
  }

  onFiltreChange(): void {
    this.pageActuelle = 1;
    this.appliquerFiltresEtTri();
  }

  changerTri(champ: SortField): void {
    if (this.sortBy === champ) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = champ;
      this.sortDir = champ === 'score' ? 'desc' : 'asc';
    }
    this.appliquerFiltresEtTri();
  }

  reinitialiserFiltres(): void {
    this.searchTerm = '';
    this.statutSelectionne = '';
    this.scoreMinimum = 0;
    this.sortBy = 'score';
    this.sortDir = 'desc';
    this.appliquerFiltresEtTri();
  }

  private appliquerFiltresEtTri(): void {
    let resultat = [...this.candidatures];

    if (this.statutSelectionne) {
      resultat = resultat.filter((c) => c.statut === this.statutSelectionne);
    }

    if (this.scoreMinimum > 0) {
      resultat = resultat.filter(
        (c) => (c.scoreMatching ?? 0) >= this.scoreMinimum,
      );
    }

    if (this.searchTerm.trim()) {
      const terme = this.searchTerm.trim().toLowerCase();
      resultat = resultat.filter(
        (c) =>
          c.nomComplet?.toLowerCase().includes(terme) ||
          c.email?.toLowerCase().includes(terme) ||
          c.specialite?.toLowerCase().includes(terme) ||
          c.competences?.some((comp) => comp.toLowerCase().includes(terme)),
      );
    }

    resultat.sort((a, b) => {
      let comparaison = 0;
      switch (this.sortBy) {
        case 'score':
          comparaison = (a.scoreMatching ?? -1) - (b.scoreMatching ?? -1);
          break;
        case 'nom':
          comparaison = (a.nomComplet ?? '').localeCompare(b.nomComplet ?? '');
          break;
        default:
          comparaison =
            new Date(a.dateCandidature ?? 0).getTime() -
            new Date(b.dateCandidature ?? 0).getTime();
      }
      return this.sortDir === 'asc' ? comparaison : -comparaison;
    });

    this.candidaturesFiltrees = resultat;
    this.appliquerPagination();
  }

  get totalCandidatures(): number {
    return this.candidatures.length;
  }

  compteParStatut(statut: ApplicationStatus): number {
    return this.candidatures.filter((c) => c.statut === statut).length;
  }

  get scoreMoyen(): number {
    const scores = this.candidatures
      .map((c) => c.scoreMatching)
      .filter((s): s is number => s !== undefined && s !== null);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  }

  get nombreProfilsExcellents(): number {
    return this.candidatures.filter((c) => (c.scoreMatching ?? 0) >= 70).length;
  }

  get filtresActifs(): number {
    return [
      this.searchTerm,
      this.statutSelectionne,
      this.scoreMinimum > 0 ? 'oui' : '',
    ].filter((v) => !!v).length;
  }

  appliquerPagination(): void {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    this.candidaturesAffichees = this.candidaturesFiltrees.slice(
      debut,
      debut + this.elementsParPage,
    );
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.candidaturesFiltrees.length / this.elementsParPage),
    );
  }

  allerPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageActuelle = page;
    this.appliquerPagination();
  }

  get pagesAffichees(): number[] {
    const total = this.totalPages;
    const courante = this.pageActuelle;
    const debut = Math.max(1, courante - 2);
    const fin = Math.min(total, debut + 4);
    const pages: number[] = [];
    for (let i = debut; i <= fin; i++) pages.push(i);
    return pages;
  }

  prochainStatutsPossibles(candidature: ApplicationDto): StatutOption[] {
    if (!candidature.statut) return [];
    const suivants = (TRANSITIONS_POSSIBLES[candidature.statut] ?? []).filter(
      (v) => !STATUTS_RESERVES_WORKFLOW_ENTRETIEN.includes(v),
    );
    return suivants.map((v) => ({ valeur: v, label: LABELS_STATUT[v] }));
  }

  peutPlanifierEntretien(candidature: ApplicationDto): boolean {
    return candidature.statut === ApplicationStatus.SELECTIONNE;
  }

  estEnEtapeEntretien(candidature: ApplicationDto): boolean {
    return (
      !!candidature.statut &&
      STATUTS_RESERVES_WORKFLOW_ENTRETIEN.includes(candidature.statut)
    );
  }

  afficherBoutonEntretien(candidature: ApplicationDto): boolean {
    return (
      this.peutPlanifierEntretien(candidature) ||
      this.estEnEtapeEntretien(candidature)
    );
  }

  labelBoutonEntretien(candidature: ApplicationDto): string {
    if (this.peutPlanifierEntretien(candidature)) {
      return "Planifier l'entretien RH";
    }
    return "Gérer l'entretien";
  }

  private async selectionnerEtPlanifier(
    candidature: ApplicationDto,
  ): Promise<void> {
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Sélectionner ce candidat ?',
      text: `${candidature.nomComplet} passera au statut « Sélectionné ». Vous pourrez planifier l'entretien RH maintenant ou plus tard.`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Sélectionner et planifier',
      denyButtonText: 'Sélectionner seulement',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#7c3aed',
      denyButtonColor: '#6b7280',
    });

    if (confirmation.isDismissed) return;

    const candidatureMaj = await this.mettreAJourStatut(
      candidature,
      ApplicationStatus.SELECTIONNE,
    );

    if (!candidatureMaj) return;

    if (confirmation.isConfirmed) {
      this.ouvrirCalendrierPourPlanification(candidatureMaj, 'rh-initial');
      return;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Candidat sélectionné',
      text: "Utilisez le bouton « Planifier l'entretien RH » quand vous serez prêt.",
      timer: 2200,
      showConfirmButton: false,
    });
  }

  private async rejeterCandidature(candidature: ApplicationDto): Promise<void> {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Rejeter cette candidature ?',
      text: `${candidature.nomComplet} recevra un email avec votre commentaire.`,
      input: 'textarea',
      inputLabel: 'Motif du refus',
      inputPlaceholder: 'Expliquez brièvement la décision...',
      inputAttributes: {
        maxlength: '2000',
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Le commentaire est obligatoire pour rejeter une candidature.';
        }
        return undefined;
      },
      showCancelButton: true,
      confirmButtonText: 'Rejeter la candidature',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmation.isConfirmed) return;

    const candidatureMaj = await this.mettreAJourStatut(
      candidature,
      ApplicationStatus.REJETE,
      confirmation.value.trim(),
    );

    if (candidatureMaj) {
      await Swal.fire({
        icon: 'success',
        title: 'Candidature rejetée',
        text: 'Le candidat a été informé par email.',
        timer: 1800,
        showConfirmButton: false,
      });
    }
  }

  private async mettreAJourStatut(
    candidature: ApplicationDto,
    nouveauStatut: ApplicationStatus,
    commentaireRH?: string,
  ): Promise<ApplicationDto | null> {
    if (!candidature.idApplication) return null;

    this.candidatureEnCoursDeMaj = candidature.idApplication;

    try {
      const candidatureMaj = await firstValueFrom(
        this.applyService.changerStatut(candidature.idApplication, {
          nouveauStatut,
          commentaireRH,
        }),
      );

      const index = this.candidatures.findIndex(
        (c) => c.idApplication === candidatureMaj.idApplication,
      );

      if (index !== -1) {
        this.candidatures[index] = candidatureMaj;
      }

      this.appliquerFiltresEtTri();

      return candidatureMaj;
    } catch (error) {
      console.error('Erreur de mise à jour du statut :', error);

      await Swal.fire(
        'Erreur',
        'Impossible de mettre à jour le statut de la candidature.',
        'error',
      );

      return null;
    } finally {
      this.candidatureEnCoursDeMaj = null;
    }
  }

  private ouvrirCalendrierPourPlanification(
    candidature: ApplicationDto,
    typeEntretien: RecrutementInterviewType,
  ): void {
    if (!candidature.idApplication) return;
    this.router.navigate(['/rh/calendrierRH'], {
      state: {
        planifierEntretien: {
          applicationId: candidature.idApplication,
          candidateName: candidature.nomComplet ?? 'Candidat',
          candidateEmail: candidature.email ?? '',
          posteRecrutement: this.poste?.titre ?? '',
          typeEntretien,
        } as PlanificationCandidatureContext,
      },
    });
  }

  async gererEtapeEntretien(candidature: ApplicationDto): Promise<void> {
    if (!candidature.idApplication || !candidature.statut) return;

    if (candidature.statut === ApplicationStatus.SELECTIONNE) {
      this.ouvrirCalendrierPourPlanification(candidature, 'rh-initial');
      return;
    }

    const typeUi = typeEntretienPourStatutCourant(candidature.statut);
    if (!typeUi) return;

    const typeBackend = typeBackendPourTypeUi(typeUi);

    let entretiens: Array<{
      id?: string;
      type?: string;
      status?: string;
      interviewDate?: string;
    }>;
    try {
      entretiens = await firstValueFrom(
        this.interviewService.getEntretiensPourCandidature(
          candidature.idApplication,
        ),
      );
    } catch {
      await Swal.fire(
        'Erreur',
        'Impossible de charger les entretiens de ce candidat.',
        'error',
      );
      return;
    }

    const entretienEnAttente = entretiens
      .filter(
        (e) =>
          e.type === typeBackend &&
          (e.status === 'PLANIFIE' || e.status === 'REPORTE'),
      )
      .sort((a, b) =>
        (b.interviewDate ?? '').localeCompare(a.interviewDate ?? ''),
      )[0];

    if (entretienEnAttente?.id) {
      await this.enregistrerResultatEntretien(
        candidature,
        entretienEnAttente.id,
      );
    } else {
      this.ouvrirCalendrierPourPlanification(candidature, typeUi);
    }
  }

  private async enregistrerResultatEntretien(
    candidature: ApplicationDto,
    interviewId: string,
  ): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: `Résultat de l'entretien — ${candidature.nomComplet}`,
      html:
        '<select id="swal-resultat" class="swal2-select">' +
        '<option value="REUSSI">Réussi</option>' +
        '<option value="ECHOUE">Échoué</option>' +
        '</select>' +
        '<textarea id="swal-notes" class="swal2-textarea" placeholder="Notes (obligatoire si échoué)"></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#7c3aed',
      preConfirm: () => {
        const resultat = (
          document.getElementById('swal-resultat') as HTMLSelectElement
        ).value as InterviewResult;
        const notes = (
          document.getElementById('swal-notes') as HTMLTextAreaElement
        ).value;
        if (resultat === ('ECHOUE' as InterviewResult) && !notes.trim()) {
          Swal.showValidationMessage(
            "Une note est obligatoire lorsque l'entretien est échoué",
          );
          return;
        }
        return { resultat, notes };
      },
    });

    if (!formValues) return;

    this.candidatureEnCoursDeMaj = candidature.idApplication ?? null;

    try {
      await firstValueFrom(
        this.interviewService.enregistrerResultat(interviewId, {
          resultat: formValues.resultat,
          notes: formValues.notes || undefined,
        }),
      );
      this.chargerCandidatures();
      await Swal.fire({
        icon: 'success',
        title: 'Résultat enregistré',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire(
        'Erreur',
        "Impossible d'enregistrer le résultat de l'entretien.",
        'error',
      );
    } finally {
      this.candidatureEnCoursDeMaj = null;
    }
  }

  async changerStatut(
    candidature: ApplicationDto,
    nouveauStatut: ApplicationStatus,
  ): Promise<void> {
    if (!candidature.idApplication) return;

    if (nouveauStatut === ApplicationStatus.REJETE) {
      await this.rejeterCandidature(candidature);
      return;
    }
    if (nouveauStatut === ApplicationStatus.SELECTIONNE) {
      await this.selectionnerEtPlanifier(candidature);
      return;
    }
    if (STATUTS_RESERVES_WORKFLOW_ENTRETIEN.includes(nouveauStatut)) {
      await this.gererEtapeEntretien(candidature);
      return;
    }

    await this.demanderCommentaireEtChangerStatut(candidature, nouveauStatut);
  }

  private async demanderCommentaireEtChangerStatut(
    candidature: ApplicationDto,
    nouveauStatut: ApplicationStatus,
  ): Promise<void> {
    if (!candidature.idApplication) return;

    const confirmation = await Swal.fire({
      title: `Confirmer le changement de statut ?`,
      text: `${candidature.nomComplet} passera à "${LABELS_STATUT[nouveauStatut]}"`,
      input: 'textarea',
      inputLabel: 'Commentaire RH (optionnel)',
      inputPlaceholder: 'Ajouter une note sur cette décision...',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#7c3aed',
    });

    if (!confirmation.isConfirmed) return;

    this.candidatureEnCoursDeMaj = candidature.idApplication;

    this.applyService
      .changerStatut(candidature.idApplication, {
        nouveauStatut,
        commentaireRH: confirmation.value || undefined,
      })
      .subscribe({
        next: (candidatureMaj) => {
          const index = this.candidatures.findIndex(
            (c) => c.idApplication === candidatureMaj.idApplication,
          );
          if (index !== -1) this.candidatures[index] = candidatureMaj;
          this.appliquerFiltresEtTri();
          this.candidatureEnCoursDeMaj = null;
          Swal.fire({
            icon: 'success',
            title: 'Statut mis à jour',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: () => {
          this.candidatureEnCoursDeMaj = null;
          Swal.fire(
            'Erreur',
            'Impossible de mettre à jour le statut.',
            'error',
          );
        },
      });
  }

  voirProfilCandidat(candidature: ApplicationDto): void {
    if (!candidature.candidatKeycloakId) return;
    this.router.navigate([
      '/rh/consulterprofilUser',
      candidature.candidatKeycloakId,
    ]);
  }

  telechargerLettreMotivation(candidature: ApplicationDto): void {
    if (!candidature.idApplication || !candidature.lettreMotivationPdfPresente)
      return;

    this.applyService
      .telechargerLettreMotivation(candidature.idApplication)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: () => {
          Swal.fire(
            'Erreur',
            'Impossible de télécharger la lettre de motivation.',
            'error',
          );
        },
      });
  }

  retour(): void {
    this.router.navigate(['/rh/ConsulteLesPosteQuiLesCandidatsPostulent']);
  }

  exporterCsv(): void {
    const entetes = [
      'Nom',
      'Email',
      'Téléphone',
      'Spécialité',
      'Formation',
      "Années d'expérience",
      'Score matching (%)',
      'Statut',
      'Date de candidature',
    ];
    const lignes = this.candidaturesFiltrees.map((c) => [
      c.nomComplet ?? '',
      c.email ?? '',
      c.telephone ?? '',
      c.specialite ?? '',
      c.formation ?? '',
      c.anneesExperienceCandidat ?? '',
      c.scoreMatching ?? '',
      c.statut ? LABELS_STATUT[c.statut] : '',
      c.dateCandidature ?? '',
    ]);

    const csv = [entetes, ...lignes].map((ligne) => ligne.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `candidatures-${this.poste?.titre ?? this.posteId}.csv`;
    lien.click();
    window.URL.revokeObjectURL(url);
  }

  labelStatut(statut?: ApplicationStatus): string {
    return statut ? LABELS_STATUT[statut] : 'Inconnu';
  }

  classeStatut(statut?: ApplicationStatus): string {
    const map: Partial<Record<ApplicationStatus, string>> = {
      [ApplicationStatus.EN_ATTENTE]: 'badge-attente',
      [ApplicationStatus.SELECTIONNE]: 'badge-selectionne',
      [ApplicationStatus.EN_ENTRETIEN_RH]: 'badge-entretien',
      [ApplicationStatus.EN_ENTRETIEN_TECHNIQUE]: 'badge-entretien',
      [ApplicationStatus.EN_ENTRETIEN_FINAL]: 'badge-entretien',
      [ApplicationStatus.ACCEPTE]: 'badge-accepte',
      [ApplicationStatus.REJETE]: 'badge-refuse',
      [ApplicationStatus.RETIRE]: 'badge-retire',
    };
    return statut ? (map[statut] ?? 'badge-defaut') : 'badge-defaut';
  }

  classeScore(score?: number): string {
    if (score === undefined || score === null) return 'score-non-evalue';
    if (score >= 70) return 'score-excellent';
    if (score >= 50) return 'score-bon';
    if (score >= 30) return 'score-moyen';
    return 'score-faible';
  }

  labelScore(score?: number): string {
    if (score === undefined || score === null) return 'Non évalué';
    if (score >= 70) return 'Excellent match';
    if (score >= 50) return 'Bon match';
    if (score >= 30) return 'Match moyen';
    return 'Match faible';
  }

  trackByCandidature(_index: number, candidature: ApplicationDto): string {
    return candidature.idApplication ?? _index.toString();
  }
}
