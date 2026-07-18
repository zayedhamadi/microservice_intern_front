import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UserService } from '../../../core/service/user.service';
import { NotificationService } from '../../../core/service/notification.service';

type TabType = 'disponible' | 'cessation';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.css',
})
export class ListUsersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  clearInactifSearch(): void {
    this.inactifSearchTerm = '';
    this.applyInactifFilters();
  }

  allUsers: any[] = [];
  inactifUsers: any[] = [];

  filteredUsers: any[] = [];
  filteredInactifUsers: any[] = [];

  activeTab: TabType = 'disponible';
  isLoading = false;
  isLoadingInactif = false;
  isSearching = false;

  today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  searchTerm = '';
  inactifSearchTerm = '';

  activeRole = 'ALL';
  inactifRole = 'ALL';

  activeStatus = 'ALL';

  // Les 3 seuls rôles existants dans le système
  roles = ['ALL', 'RH', 'EMPLOYEE', 'CANDIDAT'];

  quickSearchId = '';
  quickSearchResult: any = null;
  quickSearchError = '';

  sortField = 'dateInscrit';
  sortDir: SortDir = 'desc';

  inactifSortField = 'dateCessation';
  inactifSortDir: SortDir = 'desc';

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  inactifPage = 1;
  inactifPageSize = 10;

  constructor(
    private readonly userService: UserService,
    private readonly notification: NotificationService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadInactifUsers();

    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.applyFilters();
          this.isSearching = false;
        },
        error: (err: any) => {
          console.error('[ListUsers] Erreur pipeline de recherche :', err);
          this.isSearching = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;

    this.userService
      .getAllActiveAndCongeUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: any[]) => {
          // Le backend filtre déjà etat_compte != 'INACTIF' côté SQL,
          // pas besoin (et pas possible) de filtrer sur un champ 'status' inexistant.
          this.allUsers = users ?? [];
          console.log(
            '[ListUsers] Utilisateurs disponibles chargés :',
            this.allUsers.length,
          );
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error(
            '[ListUsers] Erreur de chargement des utilisateurs disponibles :',
            err,
          );
          this.isLoading = false;
          this.notification.toastError('Erreur de chargement des utilisateurs');
        },
      });
  }

  loadInactifUsers(): void {
    this.isLoadingInactif = true;

    this.userService
      .getAllInactifUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: any[]) => {
          this.inactifUsers = users ?? [];
          console.log(
            '[ListUsers] Utilisateurs en cessation chargés :',
            this.inactifUsers.length,
          );
          this.applyInactifFilters();
          this.isLoadingInactif = false;
        },
        error: (err: any) => {
          console.error(
            '[ListUsers] Erreur de chargement des utilisateurs inactifs :',
            err,
          );
          this.isLoadingInactif = false;
          this.notification.toastError(
            'Erreur de chargement des utilisateurs inactifs',
          );
        },
      });
  }

  onSearch(): void {
    this.isSearching = true;
    this.searchSubject.next(this.searchTerm);
  }

  onInactifSearch(): void {
    this.applyInactifFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.quickSearchResult = null;
    this.quickSearchError = '';
    this.applyFilters();
  }

  setRole(r: string): void {
    this.activeRole = r;
    this.applyFilters();
  }

  setInactifRole(r: string): void {
    this.inactifRole = r;
    this.applyInactifFilters();
  }

  setStatus(s: string): void {
    this.activeStatus = s;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchTerm.toLowerCase().trim();
    let list = this.allUsers;

    if (this.activeRole !== 'ALL') {
      list = list.filter(
        (u) => this.getNormalizedRole(u.role) === this.activeRole,
      );
    }
    if (this.activeStatus !== 'ALL') {
      list = list.filter((u) => u.status === this.activeStatus);
    }
    if (q) {
      list = list.filter((u) => this.matchesQuery(u, q));
    }

    this.filteredUsers = this.sortList(list, this.sortField, this.sortDir);
    this.currentPage = 1;
  }

  applyInactifFilters(): void {
    const q = this.inactifSearchTerm.toLowerCase().trim();
    let list = this.inactifUsers;

    if (this.inactifRole !== 'ALL') {
      list = list.filter(
        (u) => this.getNormalizedRole(u.role) === this.inactifRole,
      );
    }
    if (q) {
      list = list.filter((u) => this.matchesQuery(u, q));
    }

    this.filteredInactifUsers = this.sortList(
      list,
      this.inactifSortField,
      this.inactifSortDir,
    );
    this.inactifPage = 1;
  }

  private matchesQuery(u: any, q: string): boolean {
    return [u.nom, u.prenom, u.email, u.cin, u.numTel, u.matricule].some(
      (v) => v && String(v).toLowerCase().includes(q),
    );
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeRole = 'ALL';
    this.activeStatus = 'ALL';
    this.quickSearchResult = null;
    this.quickSearchError = '';
    this.applyFilters();
  }

  // ── Sort ──────────────────────────────────────────────

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applyFilters();
  }

  sortInactif(field: string): void {
    if (this.inactifSortField === field) {
      this.inactifSortDir = this.inactifSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.inactifSortField = field;
      this.inactifSortDir = 'asc';
    }
    this.applyInactifFilters();
  }

  private sortList(list: any[], field: string, dir: SortDir): any[] {
    return [...list].sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'fr', { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  // ── Pagination disponible ─────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get rangeStart(): number {
    return this.filteredUsers.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredUsers.length,
    );
  }

  get pagedUsers(): any[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(s, s + this.pageSize);
  }

  get visiblePages(): number[] {
    return this.calcPages(this.currentPage, this.totalPages);
  }

  goToPage(p: number): void {
    this.currentPage = p;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  // ── Pagination inactif ──────────────────────────────

  get inactifTotalPages(): number {
    return (
      Math.ceil(this.filteredInactifUsers.length / this.inactifPageSize) || 1
    );
  }

  get inactifRangeStart(): number {
    return this.filteredInactifUsers.length === 0
      ? 0
      : (this.inactifPage - 1) * this.inactifPageSize + 1;
  }

  get inactifRangeEnd(): number {
    return Math.min(
      this.inactifPage * this.inactifPageSize,
      this.filteredInactifUsers.length,
    );
  }

  get pagedInactifUsers(): any[] {
    const s = (this.inactifPage - 1) * this.inactifPageSize;
    return this.filteredInactifUsers.slice(s, s + this.inactifPageSize);
  }

  get inactifVisiblePages(): number[] {
    return this.calcPages(this.inactifPage, this.inactifTotalPages);
  }

  goToInactifPage(p: number): void {
    this.inactifPage = p;
  }

  prevInactifPage(): void {
    if (this.inactifPage > 1) this.inactifPage--;
  }

  nextInactifPage(): void {
    if (this.inactifPage < this.inactifTotalPages) this.inactifPage++;
  }

  onInactifPageSizeChange(): void {
    this.inactifPage = 1;
  }

  private calcPages(current: number, total: number): number[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  // ── Tabs ─────────────────────────────────────────────

  switchTab(tab: TabType): void {
    this.activeTab = tab;
    if (tab === 'disponible') this.loadUsers();
    if (tab === 'cessation') this.loadInactifUsers();
  }

  // ── Utils ────────────────────────────────────────────

  countByRole(role: string): number {
    return this.allUsers.filter((u) => this.getNormalizedRole(u.role) === role)
      .length;
  }

  pctRole(role: string): string {
    if (!this.allUsers.length) return '0';
    return ((this.countByRole(role) / this.allUsers.length) * 100).toFixed(0);
  }

  // Couleurs par rôle — RH / EMPLOYEE / CANDIDAT
  getRoleColor(role: string): string {
    const map: Record<string, string> = {
      EMPLOYEE: '#2563eb',
      RH: '#0d9488',
      CANDIDAT: '#d97706',
    };
    return map[this.getNormalizedRole(role)] ?? '#6366f1';
  }

  // Icônes par rôle — RH / EMPLOYEE / CANDIDAT
  getRoleIcon(role: string): string {
    const map: Record<string, string> = {
      EMPLOYEE: 'fa-user',
      RH: 'fa-user-tie',
      CANDIDAT: 'fa-user-graduate',
    };
    return map[this.getNormalizedRole(role)] ?? 'fa-user';
  }

  // Normalise en MAJUSCULES pour matcher exactement RH / EMPLOYEE / CANDIDAT
  getNormalizedRole(role: string): string {
    return role ? role.toUpperCase() : '';
  }

  sanitizeImage(src: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  handleImageError(u: any): void {
    u.image = null;
  }

  loadImageForUser(u: any): void {
    if (u.image || u._imageLoaded) return;
    u._imageLoaded = true;

    this.userService
      .getUserById(u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          if (detail.image) {
            u.image = detail.image;
            console.log('[ListUsers] Image chargée pour utilisateur', u.id);
          }
        },
        error: (err: any) => {
          console.error(
            "[ListUsers] Erreur lors du chargement de l'image pour l'utilisateur",
            u.id,
            err,
          );
        },
      });
  }

  viewProfile(u: any): void {
    this.router.navigate(['/manager/consulterUserByAdmin', u.id]);
  }

  backToDashboard(): void {
    this.router.navigate(['/manager/dashboardmanager']);
  }

  trackById(_: number, u: any): number {
    return u.id;
  }

  exportCsv(): void {
    const headers = [
      'ID',
      'Nom',
      'Prénom',
      'Email',
      'Matricule',
      'CIN',
      'Téléphone',
      'Rôle',
      'Date Inscription',
    ];
    const rows = this.filteredUsers.map((u) => [
      u.id,
      u.nom,
      u.prenom,
      u.email,
      u.matricule,
      u.cin,
      u.numTel,
      u.role,
      u.dateInscrit,
    ]);
    this.downloadCsv([headers, ...rows], 'utilisateurs_disponibles.csv');
  }

  exportCessationCsv(): void {
    const headers = [
      'ID',
      'Nom',
      'Prénom',
      'Email',
      'Rôle',
      'Motif Cessation',
      'Date Cessation',
    ];
    const rows = this.filteredInactifUsers.map((u) => [
      u.id,
      u.nom,
      u.prenom,
      u.email,
      u.role,
      u.motifCessation,
      u.dateCessation,
    ]);
    this.downloadCsv([headers, ...rows], 'utilisateurs_cessation.csv');
  }

  private downloadCsv(data: any[][], filename: string): void {
    const csv = data
      .map((r) => r.map((v) => `"${v ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
