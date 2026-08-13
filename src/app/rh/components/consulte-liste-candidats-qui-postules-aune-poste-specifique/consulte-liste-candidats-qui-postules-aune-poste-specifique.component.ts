import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ApplyService } from '../../../core/service/apply.service';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { ApplicationDto } from '../../../core/models/Application';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import { ApplicationStatus } from '../../../core/models/enums/enumPosteRecrutemnt';
import { LABELS_STATUT, TRANSITIONS_POSSIBLES } from '../../../core/constant/selectPoste';

type SortField = 'score' | 'date' | 'nom';
type SortDir = 'asc' | 'desc';

interface StatutOption {
  valeur: ApplicationStatus;
  label: string;
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

  // AJOUT — pour pouvoir référencer l'enum dans le template
  readonly ApplicationStatus = ApplicationStatus;
  posteId = '';
  poste: PosteRecrutment | null = null;

  // --- données ---
  candidatures: ApplicationDto[] = [];
  candidaturesAffichees: ApplicationDto[] = [];

  // --- état UI ---
  isLoading = false;
  isLoadingPoste = false;
  errorMessage = '';
  candidatureEnCoursDeMaj: string | null = null;

  // --- filtres / recherche ---
  searchTerm = '';
  statutSelectionne = '';
  scoreMinimum = 0;

  // --- tri ---
  sortBy: SortField = 'score';
  sortDir: SortDir = 'desc';

  // --- pagination ---
  pageActuelle = 1;
  elementsParPage = 6;

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly applyService: ApplyService,
    private readonly posteService: PosteRecutementService,
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
      error: (error: any) => {
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

  // ============================================================
  // Chargement
  // ============================================================

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

  // ============================================================
  // Filtres / tri
  // ============================================================

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

  candidaturesFiltrees: ApplicationDto[] = [];

  // ============================================================
  // Statistiques (bandeau du haut)
  // ============================================================

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

  // ============================================================
  // Pagination
  // ============================================================

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

  // ============================================================
  // Actions sur une candidature
  // ============================================================

  prochainStatutsPossibles(candidature: ApplicationDto): StatutOption[] {
    if (!candidature.statut) return [];
    const suivants = TRANSITIONS_POSSIBLES[candidature.statut] ?? [];
    return suivants.map((v) => ({ valeur: v, label: LABELS_STATUT[v] }));
  }

  async changerStatut(
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

  // ============================================================
  // Export CSV
  // ============================================================

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

  // ============================================================
  // Helpers d'affichage
  // ============================================================

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
    if (score >= 70) return 'score-excellent'; // était 80
    if (score >= 50) return 'score-bon'; // était 60, décalé en cohérence
    if (score >= 30) return 'score-moyen'; // était 40
    return 'score-faible';
  }

  labelScore(score?: number): string {
    if (score === undefined || score === null) return 'Non évalué';
    if (score >= 70) return 'Excellent match'; // était 80
    if (score >= 50) return 'Bon match'; // était 60
    if (score >= 30) return 'Match moyen'; // était 40
    return 'Match faible';
  }

  trackByCandidature(_index: number, candidature: ApplicationDto): string {
    return candidature.idApplication ?? _index.toString();
  }
}
