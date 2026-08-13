import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { StatusPosteRecrutement, TypeContrat, WorkType } from '../../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { PosteAvecCandidatures, FiltrePostesAvecCandidatures } from '../../../core/models/Poste avec candidatures';



type SortField = 'date' | 'candidatures' | 'titre';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-consulte-les-poste-qui-les-candidats-postulent',
  templateUrl:
    './consulte-les-poste-qui-les-candidats-postulent.component.html',
  styleUrl: './consulte-les-poste-qui-les-candidats-postulent.component.css',
})
export class ConsulteLesPosteQuiLesCandidatsPostulentComponent
  implements OnInit, OnDestroy
{
  // --- données ---
  postes: PosteAvecCandidatures[] = [];
  postesAffiches: PosteAvecCandidatures[] = [];
  departements: string[] = [];

  // --- état UI ---
  isLoading = false;
  errorMessage = '';

  // --- filtres ---
  searchTerm = '';
  departementSelectionne = '';
  statusSelectionne = '';
  typeContratSelectionne = '';
  workTypeSelectionne = '';
  avecCandidatsUniquement = false;

  // --- tri ---
  sortBy: SortField = 'date';
  sortDir: SortDir = 'desc';

  // --- pagination (côté front, sur le résultat déjà filtré par le back) ---
  pageActuelle = 1;
  elementsParPage = 8;

  // --- listes pour les selects ---
  readonly statusOptions = Object.values(StatusPosteRecrutement);
  readonly typeContratOptions = Object.values(TypeContrat);
  readonly workTypeOptions = Object.values(WorkType);

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(
    private readonly posteService: PosteRecutementService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.chargerDepartements();
    this.chargerPostes();

    // recherche "live" avec debounce pour ne pas spammer le backend
    this.searchChange$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageActuelle = 1;
        this.chargerPostes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // Chargement des données
  // ============================================================

  chargerDepartements(): void {
    this.posteService.getDepartements().subscribe({
      next: (deps) => (this.departements = deps),
      error: (error: any) => {
        console.log('Erreur lors du chargement des départements :', error);
        // non bloquant : le filtre département sera juste vide
      },
    });
  }

  chargerPostes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filtre: FiltrePostesAvecCandidatures = {
      departementNom: this.departementSelectionne || undefined,
      status: this.statusSelectionne || undefined,
      typeContrat: this.typeContratSelectionne || undefined,
      workType: this.workTypeSelectionne || undefined,
      search: this.searchTerm.trim() || undefined,
      avecCandidatsUniquement: this.avecCandidatsUniquement,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
    };

    this.posteService.getPostesAvecCandidatures(filtre).subscribe({
      next: (postes) => {
        this.postes = postes;
        this.pageActuelle = 1;
        this.appliquerPagination();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.log('Erreur lors du chargement des départements :', error);
        this.errorMessage =
          'Impossible de charger les postes. Vérifiez votre connexion ou réessayez.';
        this.isLoading = false;
      },
    });
  }

  // ============================================================
  // Interactions filtres / tri / recherche
  // ============================================================

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchChange$.next(value);
  }

  onFiltreChange(): void {
    this.pageActuelle = 1;
    this.chargerPostes();
  }

  changerTri(champ: SortField): void {
    if (this.sortBy === champ) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = champ;
      this.sortDir = 'desc';
    }
    this.chargerPostes();
  }

  reinitialiserFiltres(): void {
    this.searchTerm = '';
    this.departementSelectionne = '';
    this.statusSelectionne = '';
    this.typeContratSelectionne = '';
    this.workTypeSelectionne = '';
    this.avecCandidatsUniquement = false;
    this.sortBy = 'date';
    this.sortDir = 'desc';
    this.chargerPostes();
  }

  get totalCandidatures(): number {
    return this.postes.reduce((total, p) => total + p.nombreCandidatures, 0);
  }

  get filtresActifs(): number {
    return [
      this.searchTerm,
      this.departementSelectionne,
      this.statusSelectionne,
      this.typeContratSelectionne,
      this.workTypeSelectionne,
      this.avecCandidatsUniquement ? 'oui' : '',
    ].filter((v) => !!v).length;
  }

  // ============================================================
  // Pagination
  // ============================================================

  appliquerPagination(): void {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    this.postesAffiches = this.postes.slice(
      debut,
      debut + this.elementsParPage,
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.postes.length / this.elementsParPage));
  }

  allerPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.pageActuelle = page;
    this.appliquerPagination();
  }

  get pagesAffichees(): number[] {
    const total = this.totalPages;
    const courante = this.pageActuelle;
    const pages: number[] = [];
    const debut = Math.max(1, courante - 2);
    const fin = Math.min(total, debut + 4);
    for (let i = debut; i <= fin; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ============================================================
  // Navigation & helpers d'affichage
  // ============================================================

  voirCandidats(poste: PosteAvecCandidatures): void {
    this.router.navigate([
      '/rh/ConsulteListeCandidatsQuiPostulesAUnePosteSpecifique',
      poste.idPosteRecrutement,
    ]);
  }

  voirDetailPoste(poste: PosteAvecCandidatures): void {
    this.router.navigate([
      '/rh/ConsulterSpecificPosteRecrutementDetaille',
      poste.idPosteRecrutement,
    ]);
  }

  tauxAvancement(poste: PosteAvecCandidatures): number {
    if (!poste.nombreCandidatures) {
      return 0;
    }
    const traitees = poste.nombreAcceptees + poste.nombreRefusees;
    return Math.round((traitees / poste.nombreCandidatures) * 100);
  }

  classeStatutPoste(status: StatusPosteRecrutement): string {
    const map: Record<string, string> = {
      OUVERT: 'badge-ouvert',
      OPEN: 'badge-ouvert',
      FERME: 'badge-ferme',
      CLOSED: 'badge-ferme',
      EXPIRE: 'badge-expire',
      EXPIRED: 'badge-expire',
    };
    return map[String(status).toUpperCase()] ?? 'badge-defaut';
  }

  trackByPosteId(_index: number, poste: PosteAvecCandidatures): string {
    return poste.idPosteRecrutement;
  }
}
