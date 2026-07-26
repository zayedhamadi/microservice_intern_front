import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { DepartementDTO } from '../../../core/models/departement';
import { DepartementService } from '../../../core/service/departement.service';

@Component({
  selector: 'app-departement',
  templateUrl: './departement.component.html',
  styleUrl: './departement.component.css',
})
export class DepartementComponent implements OnInit {
  // Données
  departements: DepartementDTO[] = [];
  filteredDepartements: DepartementDTO[] = [];

  // Recherche
  searchTerm = '';

  // Pagination (pattern maison, sans librairie externe)
  currentPage = 1;
  pageSize = 5;
  readonly pageSizeOptions = [5, 10, 15, 20, 50];

  // Etat de chargement
  isLoading = false;

  // Modal Ajout / Modification
  showModal = false;
  isEditMode = false;
  currentDepartement: DepartementDTO = this.getEmptyDepartement();
  private originalNom: string | null = null;

  constructor(private readonly departementService: DepartementService) {}

  ngOnInit(): void {
    this.loadDepartements();
  }

  // ---------- Chargement des données ----------

  loadDepartements(): void {
    this.isLoading = true;
    this.departementService.getAllDepartements().subscribe({
      next: (data) => {
        this.departements = data ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showError('Impossible de charger la liste des départements.');
      },
    });
  }

  // ---------- Recherche / filtrage ----------

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDepartements = term
      ? this.departements.filter(
          (d) =>
            (d.nom ?? '').toLowerCase().includes(term) ||
            (d.description ?? '').toLowerCase().includes(term),
        )
      : [...this.departements];

    // Recalage de la page courante si le filtrage réduit le nombre total de pages
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // ---------- Pagination ----------

  get totalPages(): number {
    return Math.ceil(this.filteredDepartements.length / this.pageSize) || 1;
  }

  get rangeStart(): number {
    return this.filteredDepartements.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredDepartements.length,
    );
  }

  get pagedDepartements(): DepartementDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDepartements.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    return this.calcPages(this.currentPage, this.totalPages);
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

  // ---------- Ouverture du modal ----------

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentDepartement = this.getEmptyDepartement();
    this.originalNom = null;
    this.showModal = true;
  }

  openEditModal(departement: DepartementDTO): void {
    this.isEditMode = true;
    this.currentDepartement = { ...departement };
    this.originalNom = departement.nom ?? null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ---------- Création / Modification ----------

  saveDepartement(): void {
    if (!this.currentDepartement.nom?.trim()) {
      this.showError('Le nom du département est obligatoire.');
      return;
    }

    if (this.isEditMode && this.originalNom) {
      this.departementService
        .updateDepartement(this.originalNom, this.currentDepartement)
        .subscribe({
          next: () => {
            this.showSuccess('Département modifié avec succès.');
            this.closeModal();
            this.loadDepartements();
          },
          error: (err) =>
            this.showError(
              this.extractError(
                err,
                'Échec de la modification du département.',
              ),
            ),
        });
    } else {
      this.departementService
        .createDepartement(this.currentDepartement)
        .subscribe({
          next: () => {
            this.showSuccess('Département créé avec succès.');
            this.closeModal();
            this.loadDepartements();
          },
          error: (err) =>
            this.showError(
              this.extractError(err, 'Échec de la création du département.'),
            ),
        });
    }
  }

  // ---------- Suppression ----------

  confirmDelete(departement: DepartementDTO): void {
    const nom = departement.nom;
    if (!nom) {
      this.showError('Département invalide : nom manquant.');
      return;
    }
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le département "${nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteDepartement(nom);
      }
    });
  }

  private deleteDepartement(nom: string): void {
    this.departementService.deleteDepartement(nom).subscribe({
      next: () => {
        this.showSuccess('Département supprimé avec succès.');
        // Si on supprime le dernier élément d'une page, on recule d'une page
        const remaining = this.filteredDepartements.length - 1;
        const maxPage = Math.max(1, Math.ceil(remaining / this.pageSize));
        if (this.currentPage > maxPage) {
          this.currentPage = maxPage;
        }
        this.loadDepartements();
      },
      error: (err) =>
        this.showError(
          this.extractError(err, 'Échec de la suppression du département.'),
        ),
    });
  }

  // ---------- Utilitaires ----------

  private getEmptyDepartement(): DepartementDTO {
    return { nom: '', description: '' } as DepartementDTO;
  }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error || fallback;
  }

  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
    });
  }

  trackByNom(index: number, item: DepartementDTO): string {
    return item.nom ?? item.id?.toString() ?? index.toString();
  }
}
