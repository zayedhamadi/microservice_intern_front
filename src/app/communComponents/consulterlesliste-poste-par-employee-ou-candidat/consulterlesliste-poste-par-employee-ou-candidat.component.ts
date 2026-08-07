
import { Component, OnInit } from '@angular/core';

import Swal from 'sweetalert2';
import { DepartementDTO } from '../../core/models/departement';
import { TypeContrat, WorkType, StatusPosteRecrutement } from '../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecrutment } from '../../core/models/PosteRecrutment';
import { DepartementService } from '../../core/service/departement.service';
import { PosteRecutementService } from '../../core/service/poste-recutement.service';
import { Router } from '@angular/router'; import { AuthService } from '../../core/service/auth.service';

interface JobFilters {
  searchText: string;
  nom: string;
  typeContrat: string;
  workType: string;
  status: string;
  lieu: string;
  anneesExperienceMin: number | null;
}

type FilterKey = keyof JobFilters;

@Component({
  selector: 'app-consulterlesliste-poste-par-employee-ou-candidat',
  templateUrl:
    './consulterlesliste-poste-par-employee-ou-candidat.component.html',
  styleUrl: './consulterlesliste-poste-par-employee-ou-candidat.component.css',
})
export class ConsulterleslistePosteParEmployeeOuCandidatComponent implements OnInit {
  role: string | null = null;
  constructor(
    private authService: AuthService,
    private router: Router,
    private posteRecrutementService: PosteRecutementService,
    private departementService: DepartementService,
  ) { }
   getDetailsRoute(posteId?: string): string | null {
    if (!posteId) return null;
    if (this.role === 'CANDIDAT') {
      return `/candidat/consulterspecifiPosteDisponibless/${posteId}`;
    } else if (this.role === 'EMPLOYEE') {
      return `/manager/consulterspecifiPosteDisponibles/${posteId}`;
    }
    return `/rh/consulterspecifiPosteDisponibles/${posteId}`;
  }

  postes: PosteRecrutment[] = [];
  filteredPostes: PosteRecrutment[] = [];
  departements: DepartementDTO[] = [];

  typeContratEnum = Object.values(TypeContrat);
  workTypeEnum = Object.values(WorkType);
  statusEnum = Object.values(StatusPosteRecrutement);

  isLoading = true;
  hasError = false;

  filters: JobFilters = {
    searchText: '',
    nom: '',
    typeContrat: '',
    workType: '',
    status: '',
    lieu: '',
    anneesExperienceMin: null,
  };

  sortBy: 'recent' | 'ancien' | 'salaireDesc' | 'salaireAsc' = 'recent';

  currentPage = 1;
  itemsPerPage = 6;

  ngOnInit(): void {
    this.loadDepartements();
    this.loadPostes();
    this.role = this.authService.getCurrentUser()?.role || null;
    
  }






  loadPostes(): void {
    this.isLoading = true;
    this.hasError = false;

    this.posteRecrutementService.getAllPostes().subscribe({
      next: (data: PosteRecrutment[]) => {
        this.postes = data ?? [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        console.error('Erreur chargement postes :', err);
        this.hasError = true;
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger la liste des postes de recrutement.',
          confirmButtonColor: '#0d6efd',
        });
      },
    });
  }

  loadDepartements(): void {
    this.departementService.getAllDepartements().subscribe({
      next: (data: DepartementDTO[]) => {
        this.departements = data ?? [];
      },
      error: (err) => console.error('Erreur chargement départements :', err),
    });
  }

  private normalize(value?: string | null): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  applyFilters(): void {
    let result = [...this.postes];
    const f = this.filters;

    if (f.searchText.trim()) {
      const search = this.normalize(f.searchText);
      result = result.filter(
        (p) =>
          this.normalize(p.titre).includes(search) ||
          this.normalize(p.description).includes(search) ||
          p.competencesRequises?.some((c) =>
            this.normalize(c).includes(search),
          ),
      );
    }

    if (f.nom) {
      const target = this.normalize(f.nom);
      result = result.filter(
        (p) => this.normalize(p.departementNom) === target,
      );
    }

    if (f.typeContrat) {
      result = result.filter((p) => p.typeContrat === f.typeContrat);
    }

    if (f.workType) {
      result = result.filter((p) => p.workType === f.workType);
    }

    if (f.status) {
      result = result.filter((p) => p.status === f.status);
    }

    if (f.lieu.trim()) {
      const lieu = this.normalize(f.lieu);
      result = result.filter((p) => this.normalize(p.lieu).includes(lieu));
    }

    if (f.anneesExperienceMin !== null && f.anneesExperienceMin !== undefined) {
      result = result.filter(
        (p) =>
          (p.anneesExperienceMin ?? 0) >= (f.anneesExperienceMin as number),
      );
    }

    result = this.sortPostes(result);

    this.filteredPostes = result;
    this.currentPage = 1;
  }

  sortPostes(list: PosteRecrutment[]): PosteRecrutment[] {
    const sorted = [...list];
    switch (this.sortBy) {
      case 'recent':
        return sorted.sort(
          (a, b) =>
            new Date(b.datePosteRecrutement ?? 0).getTime() -
            new Date(a.datePosteRecrutement ?? 0).getTime(),
        );
      case 'ancien':
        return sorted.sort(
          (a, b) =>
            new Date(a.datePosteRecrutement ?? 0).getTime() -
            new Date(b.datePosteRecrutement ?? 0).getTime(),
        );
      case 'salaireDesc':
        return sorted.sort((a, b) => (b.salaire ?? 0) - (a.salaire ?? 0));
      case 'salaireAsc':
        return sorted.sort((a, b) => (a.salaire ?? 0) - (b.salaire ?? 0));
      default:
        return sorted;
    }
  }

  onSortChange(): void {
    this.applyFilters();
  }

  removeFilter(key: FilterKey): void {
    if (key === 'anneesExperienceMin') {
      this.filters.anneesExperienceMin = null;
    } else {
      this.filters[key] = '';
    }
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = {
      searchText: '',
      nom: '',
      typeContrat: '',
      workType: '',
      status: '',
      lieu: '',
      anneesExperienceMin: null,
    };
    this.sortBy = 'recent';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    const f = this.filters;
    return !!(
      f.searchText ||
      f.nom ||
      f.typeContrat ||
      f.workType ||
      f.status ||
      f.lieu ||
      f.anneesExperienceMin
    );
  }

  get activeFilterChips(): { key: FilterKey; label: string }[] {
    const f = this.filters;
    const chips: { key: FilterKey; label: string }[] = [];
    if (f.searchText)
      chips.push({ key: 'searchText', label: `"${f.searchText}"` });
    if (f.nom) chips.push({ key: 'nom', label: f.nom });
    if (f.typeContrat) chips.push({ key: 'typeContrat', label: f.typeContrat });
    if (f.workType) chips.push({ key: 'workType', label: f.workType });
    if (f.status) chips.push({ key: 'status', label: f.status });
    if (f.lieu) chips.push({ key: 'lieu', label: f.lieu });
    if (f.anneesExperienceMin)
      chips.push({
        key: 'anneesExperienceMin',
        label: `${f.anneesExperienceMin}+ ans exp.`,
      });
    return chips;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  isExpiringSoon(poste: PosteRecrutment): boolean {
    if (!poste.dateExpirationPosteRecrutement) return false;
    const diffDays =
      (new Date(poste.dateExpirationPosteRecrutement).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 5;
  }

  getDeptInitial(nom?: string): string {
    return nom?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  }

  trackByPoste(index: number, poste: PosteRecrutment): string {
    return poste.idPosteRecrutement ?? index.toString();
  }
}
