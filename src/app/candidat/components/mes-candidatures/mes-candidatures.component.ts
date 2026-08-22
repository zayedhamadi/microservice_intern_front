import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationDto } from '../../../core/models/Application';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import {
  ApplicationStatus,
  TypeContrat,
  WorkType,
} from '../../../core/models/enums/enumPosteRecrutemnt';
import { ApplyService } from '../../../core/service/apply.service';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { NotificationService } from '../../../core/service/notification.service';

interface CandidatureVm {
  candidature: ApplicationDto;
  poste: PosteRecrutment | null;
}

type SortOption = 'date-desc' | 'date-asc' | 'titre-asc' | 'titre-desc';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

@Component({
  selector: 'app-mes-candidatures',
  templateUrl: './mes-candidatures.component.html',
  styleUrl: './mes-candidatures.component.css',
})
export class MesCandidaturesComponent implements OnInit {
  readonly ApplicationStatus = ApplicationStatus;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly typeContratOptions = Object.values(TypeContrat);
  readonly workTypeOptions = Object.values(WorkType);

  isLoading = true;
  hasError = false;

  private allItems: CandidatureVm[] = [];
  filteredItems: CandidatureVm[] = [];
  pagedItems: CandidatureVm[] = [];

  departementOptions: string[] = [];

  voirEtatDetaille(posteId: string | undefined): void {
    if (!posteId) return;
    this.router.navigate([
      '/candidat/consulterEtatEthistoriqueParDetailleDuneCandidatureSpecifique',
      posteId,
    ]);
  }
  searchTerm = '';
  statutFilter: ApplicationStatus | 'TOUS' = 'TOUS';
  typeContratFilter: TypeContrat | 'TOUS' = 'TOUS';
  workTypeFilter: WorkType | 'TOUS' = 'TOUS';
  departementFilter = 'TOUS';
  sortOption: SortOption = 'date-desc';

  // Pagination (côté client)
  pageSize = 10;
  currentPage = 1;

  isRetraitEnCoursId: string | null = null;

  constructor(
    private applyService: ApplyService,
    private posteRecrutementService: PosteRecutementService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.applyService.getMesCandidatures().subscribe({
      next: (candidatures) => {
        this.posteRecrutementService.getAllPostes().subscribe({
          next: (postes: PosteRecrutment[]) => {
            const posteMap = new Map<string, PosteRecrutment>();
            (postes ?? []).forEach((p) => {
              if (p.idPosteRecrutement) posteMap.set(p.idPosteRecrutement, p);
            });

            this.allItems = candidatures.map((c) => ({
              candidature: c,
              poste: c.posteRecrutementId
                ? (posteMap.get(c.posteRecrutementId) ?? null)
                : null,
            }));

            this.departementOptions = Array.from(
              new Set(
                this.allItems
                  .map((i) => i.poste?.departementNom)
                  .filter((d): d is string => !!d),
              ),
            ).sort();

            this.applyFilters();
            this.isLoading = false;
          },
          error: () => {
            // Les détails des postes n'ont pas pu être chargés : on affiche quand même les candidatures.
            this.allItems = candidatures.map((c) => ({
              candidature: c,
              poste: null,
            }));
            this.applyFilters();
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
        console.error('Erreur chargement candidatures :', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  // =========================================================
  // Filtrage / tri / pagination
  // =========================================================

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    let items = this.allItems.filter(({ candidature, poste }) => {
      if (
        this.statutFilter !== 'TOUS' &&
        candidature.statut !== this.statutFilter
      ) {
        return false;
      }
      if (
        this.typeContratFilter !== 'TOUS' &&
        poste?.typeContrat !== this.typeContratFilter
      ) {
        return false;
      }
      if (
        this.workTypeFilter !== 'TOUS' &&
        poste?.workType !== this.workTypeFilter
      ) {
        return false;
      }
      if (
        this.departementFilter !== 'TOUS' &&
        poste?.departementNom !== this.departementFilter
      ) {
        return false;
      }
      if (term) {
        const haystack = [
          poste?.titre,
          poste?.departementNom,
          poste?.lieu,
          candidature.commentaireRH,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    items = this.sortItems(items);

    this.filteredItems = items;
    this.currentPage = 1;
    this.updatePagedItems();
  }

  private sortItems(items: CandidatureVm[]): CandidatureVm[] {
    const sorted = [...items];
    switch (this.sortOption) {
      case 'date-asc':
        sorted.sort((a, b) => this.dateValue(a) - this.dateValue(b));
        break;
      case 'date-desc':
        sorted.sort((a, b) => this.dateValue(b) - this.dateValue(a));
        break;
      case 'titre-asc':
        sorted.sort((a, b) =>
          (a.poste?.titre ?? '').localeCompare(b.poste?.titre ?? ''),
        );
        break;
      case 'titre-desc':
        sorted.sort((a, b) =>
          (b.poste?.titre ?? '').localeCompare(a.poste?.titre ?? ''),
        );
        break;
    }
    return sorted;
  }

  private dateValue(item: CandidatureVm): number {
    return item.candidature.dateCandidature
      ? new Date(item.candidature.dateCandidature).getTime()
      : 0;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statutFilter = 'TOUS';
    this.typeContratFilter = 'TOUS';
    this.workTypeFilter = 'TOUS';
    this.departementFilter = 'TOUS';
    this.sortOption = 'date-desc';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.searchTerm.trim() ||
      this.statutFilter !== 'TOUS' ||
      this.typeContratFilter !== 'TOUS' ||
      this.workTypeFilter !== 'TOUS' ||
      this.departementFilter !== 'TOUS'
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get rangeStart(): number {
    return this.filteredItems.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredItems.length,
    );
  }

  updatePagedItems(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedItems();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagedItems();
  }

  // =========================================================
  // Stats
  // =========================================================

  get totalCount(): number {
    return this.allItems.length;
  }

  get countEnAttente(): number {
    return this.allItems.filter(
      (i) => i.candidature.statut === ApplicationStatus.EN_ATTENTE,
    ).length;
  }

  get countEnCours(): number {
    const enCours: ApplicationStatus[] = [
      ApplicationStatus.SELECTIONNE,
      ApplicationStatus.EN_ENTRETIEN_RH,
      ApplicationStatus.EN_ENTRETIEN_TECHNIQUE,
      ApplicationStatus.EN_ENTRETIEN_FINAL,
    ];
    return this.allItems.filter((i) =>
      enCours.includes(i.candidature.statut as ApplicationStatus),
    ).length;
  }

  get countAcceptees(): number {
    return this.allItems.filter(
      (i) => i.candidature.statut === ApplicationStatus.ACCEPTE,
    ).length;
  }

  get countClotures(): number {
    return this.allItems.filter(
      (i) =>
        i.candidature.statut === ApplicationStatus.REJETE ||
        i.candidature.statut === ApplicationStatus.RETIRE,
    ).length;
  }

  // =========================================================
  // Actions
  // =========================================================

  voirPoste(posteId?: string): void {
    if (!posteId) return;
    this.router.navigate([
      '/candidat/consulterspecifiPosteDisponibless',
      posteId,
    ]);
  }

  modifierCandidature(posteId?: string): void {
    if (!posteId) return;
    this.router.navigate(['/candidat/updatePosteForSpecificPoste', posteId]);
  }

  repostuler(posteId?: string): void {
    if (!posteId) return;
    this.router.navigate(['/candidat/postulerAunePosteSpecific', posteId]);
  }

  retirerCandidature(item: CandidatureVm): void {
    const id = item.candidature.idApplication;
    if (!id || this.isRetraitEnCoursId) return;

    this.isRetraitEnCoursId = id;
    this.applyService.retirerCandidature(id).subscribe({
      next: () => {
        this.isRetraitEnCoursId = null;
        item.candidature.statut = ApplicationStatus.RETIRE;
        this.notificationService.toastSuccess('Candidature retirée.');
        this.applyFilters();
      },
      error: () => {
        this.isRetraitEnCoursId = null;
        this.notificationService.toastError(
          'Impossible de retirer la candidature.',
        );
      },
    });
  }

  telechargerLettre(item: CandidatureVm): void {
    const id = item.candidature.idApplication;
    if (!id) return;

    this.applyService.telechargerLettreMotivation(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          item.candidature.lettreMotivationPdfFileName ??
          'lettre-motivation.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.notificationService.toastError(
          'Impossible de télécharger la lettre de motivation.',
        );
      },
    });
  }

  canRetirer(candidature: ApplicationDto): boolean {
    const statutsRetirables = new Set([
      ApplicationStatus.EN_ATTENTE,
      ApplicationStatus.SELECTIONNE,
      ApplicationStatus.EN_ENTRETIEN_RH,
      ApplicationStatus.EN_ENTRETIEN_TECHNIQUE,
      ApplicationStatus.EN_ENTRETIEN_FINAL,
    ]);
    return statutsRetirables.has(candidature.statut as ApplicationStatus);
  }

  canModifier(candidature: ApplicationDto): boolean {
    return candidature.statut === ApplicationStatus.EN_ATTENTE;
  }

  canRepostuler(candidature: ApplicationDto): boolean {
    return candidature.statut === ApplicationStatus.RETIRE;
  }

  // =========================================================
  // Affichage
  // =========================================================

  getStatusLabel(status?: ApplicationStatus): string {
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
    return status ? (labels[status] ?? status) : '';
  }

  getStatusClass(status?: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.ACCEPTE:
        return 'status-badge success';
      case ApplicationStatus.REJETE:
      case ApplicationStatus.RETIRE:
        return 'status-badge muted';
      case ApplicationStatus.EN_ATTENTE:
        return 'status-badge pending';
      default:
        return 'status-badge progress';
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
}
