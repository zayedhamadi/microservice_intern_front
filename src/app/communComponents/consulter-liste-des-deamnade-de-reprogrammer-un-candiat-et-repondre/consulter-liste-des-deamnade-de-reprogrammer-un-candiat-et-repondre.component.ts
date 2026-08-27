import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  TypeDemandeReport,
  Reprogrammer,
  DemandeReportStatus,
} from '../../core/models/Reprogramme';
import { ReprogrammerService } from '../../core/service/reporte-entretient.service';

type FiltreType = 'TOUS' | TypeDemandeReport;
type ModeModal = 'refuser' | 'voirMotif' | null;

const CLE_CONTEXTE_REPROGRAMMATION = 'reprogrammation_contexte';

@Component({
  selector:
    'app-consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre',
  templateUrl:
    './consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre.component.html',
  styleUrl:
    './consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre.component.css',
})
export class ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent
  implements OnInit, OnDestroy
{
  demandes: Reprogrammer[] = [];
  demandesFiltrees: Reprogrammer[] = [];
  demandesPage: Reprogrammer[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  // ---- Rôle courant (déduit de la route) ----
  role: 'RH' | 'EMPLOYEE' = 'RH';
  get titreEspace(): string {
    return this.role === 'RH'
      ? 'Espace RH — Demandes de reprogrammation'
      : 'Espace Employé — Demandes de reprogrammation';
  }

  // ---- Recherche / filtres ----
  recherche = '';
  filtreType: FiltreType = 'TOUS';
  readonly TypeDemandeReport = TypeDemandeReport;
  readonly DemandeReportStatus = DemandeReportStatus;

  // ---- Pagination ----
  pageActuelle = 1;
  taillePage = 5;
  readonly taillesPageDisponibles = [5, 10, 20, 50];

  // ---- Modales ----
  demandeSelectionnee: Reprogrammer | null = null;
  modeModal: ModeModal = null;
  commentaireRefus = '';
  envoiEnCours = false;

  private destroy$ = new Subject<void>();

  constructor(
    private reprogrammerService: ReprogrammerService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const rolesRoute = this.route.snapshot.data['roles'] as
      | string[]
      | undefined;
    if (rolesRoute?.includes('RH')) this.role = 'RH';
    else if (rolesRoute?.includes('EMPLOYEE')) this.role = 'EMPLOYEE';

    this.chargerDemandes();

    // Retour depuis la page calendrier après proposition d'une nouvelle date
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['propositionEnvoyee'] === '1') {
          this.successMessage = 'Nouvelle date proposée avec succès.';
          sessionStorage.removeItem(CLE_CONTEXTE_REPROGRAMMATION);
          this.chargerDemandes();
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CHARGEMENT ====================

  chargerDemandes(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reprogrammerService
      .getATraiter()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.demandes = data ?? [];
          this.appliquerFiltres();
          this.loading = false;
        },
        error: (err: any) => {
          console.log(err);
          this.errorMessage =
            err.message ?? 'Impossible de charger les demandes.';
          this.loading = false;
        },
      });
  }

  rafraichir(): void {
    this.chargerDemandes();
  }

  // ==================== FILTRES / RECHERCHE ====================

  onRechercheChange(): void {
    this.pageActuelle = 1;
    this.appliquerFiltres();
  }

  onFiltreTypeChange(): void {
    this.pageActuelle = 1;
    this.appliquerFiltres();
  }

  appliquerFiltres(): void {
    const terme = this.recherche.trim().toLowerCase();

    this.demandesFiltrees = this.demandes.filter((d) => {
      const matchType =
        this.filtreType === 'TOUS' || d.type === this.filtreType;
      if (!matchType) return false;
      if (!terme) return true;

      const champs = [
        d.candidateName,
        d.posteRecrutement,
        d.interviewerName,
        d.motif,
        d.nouvelleDateProposee,
      ]
        .filter(Boolean)
        .map((c) => (c as string).toLowerCase());

      return champs.some((c) => c.includes(terme));
    });

    this.mettreAJourPagination();
  }

  // ==================== PAGINATION ====================

  get nombreTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.demandesFiltrees.length / this.taillePage),
    );
  }

  mettreAJourPagination(): void {
    if (this.pageActuelle > this.nombreTotalPages) {
      this.pageActuelle = this.nombreTotalPages;
    }
    const debut = (this.pageActuelle - 1) * this.taillePage;
    this.demandesPage = this.demandesFiltrees.slice(
      debut,
      debut + this.taillePage,
    );
  }

  allerPage(page: number): void {
    if (page < 1 || page > this.nombreTotalPages) return;
    this.pageActuelle = page;
    this.mettreAJourPagination();
  }

  pagePrecedente(): void {
    this.allerPage(this.pageActuelle - 1);
  }

  pageSuivante(): void {
    this.allerPage(this.pageActuelle + 1);
  }

  onTaillePageChange(): void {
    this.pageActuelle = 1;
    this.mettreAJourPagination();
  }

  get pagesAffichees(): number[] {
    const total = this.nombreTotalPages;
    const courante = this.pageActuelle;
    const delta = 2;
    const debut = Math.max(1, courante - delta);
    const fin = Math.min(total, courante + delta);
    const pages: number[] = [];
    for (let i = debut; i <= fin; i++) pages.push(i);
    return pages;
  }

  // ==================== ACTIONS ====================

  accepter(demande: Reprogrammer): void {
    if (!demande.id || this.envoiEnCours) return;
    this.envoiEnCours = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reprogrammerService
      .accepter(demande.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Demande acceptée avec succès.';
          this.envoiEnCours = false;
          this.chargerDemandes();
        },
        error: (err) => {
          this.errorMessage = err.message ?? "Erreur lors de l'acceptation.";
          this.envoiEnCours = false;
        },
      });
  }

  ouvrirModalRefus(demande: Reprogrammer): void {
    this.demandeSelectionnee = demande;
    this.modeModal = 'refuser';
    this.commentaireRefus = '';
    this.errorMessage = '';
  }

  ouvrirModalMotif(demande: Reprogrammer): void {
    this.demandeSelectionnee = demande;
    this.modeModal = 'voirMotif';
  }

  fermerModal(): void {
    this.demandeSelectionnee = null;
    this.modeModal = null;
    this.commentaireRefus = '';
  }

  confirmerRefus(): void {
    if (!this.demandeSelectionnee?.id || this.envoiEnCours) return;
    this.envoiEnCours = true;
    this.errorMessage = '';

    this.reprogrammerService
      .refuser(this.demandeSelectionnee.id, {
        commentaire: this.commentaireRefus?.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Demande refusée.';
          this.envoiEnCours = false;
          this.fermerModal();
          this.chargerDemandes();
        },
        error: (err) => {
          this.errorMessage = err.message ?? 'Erreur lors du refus.';
          this.envoiEnCours = false;
        },
      });
  }

  /**
   * Redirige vers le calendrier pour que l'utilisateur clique lui-même
   * sur la date qu'il souhaite proposer. Le contexte (demandeId, interviewId)
   * est mémorisé pour que la page calendrier sache quoi envoyer.
   */
  proposerAutreDate(demande: Reprogrammer): void {
    if (!demande.interviewId) return;

    sessionStorage.setItem(
      CLE_CONTEXTE_REPROGRAMMATION,
      JSON.stringify({
        demandeId: demande.id,
        interviewId: demande.interviewId,
        candidateName: demande.candidateName,
        returnUrl: this.router.url.split('?')[0],
      }),
    );

    if (this.role === 'RH') {
      this.router.navigate(['/rh/calendrierRH'], {
        queryParams: {
          modeReprogrammation: 1,
          demandeId: demande.id,
          interviewId: demande.interviewId,
        },
      });
    } else {
      this.router.navigate(['/employee/calendrierEmployee'], {
        queryParams: {
          modeReprogrammation: 1,
          demandeId: demande.id,
          interviewId: demande.interviewId,
        },
      });
    }
  }

  
  candidatKeycloakId(demande: Reprogrammer): string | undefined {
    return demande.type === TypeDemandeReport.PROPOSITION_INTERVENANT
      ? demande.cibleKeycloakId
      : demande.demandeurKeycloakId;
  }

  voirProfil(demande: Reprogrammer): void {
    const candidatId = this.candidatKeycloakId(demande);
    if (!candidatId) {
      this.errorMessage = 'Profil du candidat introuvable pour cette demande.';
      return;
    }
    const route =
      this.role === 'RH'
        ? ['/rh/consulterprofilUser', candidatId]
        : ['/employee/consulterUserByAdmin', candidatId];
    this.router.navigate(route);
  }

  // ==================== AFFICHAGE ====================

  libelleType(type: TypeDemandeReport): string {
    switch (type) {
      case TypeDemandeReport.DEMANDE_CANDIDAT:
        return 'Demande du candidat';
      case TypeDemandeReport.PROPOSITION_INTERVENANT:
        return "Proposition de l'intervenant";
      case TypeDemandeReport.REACTIVATION_APRES_ABSENCE:
        return 'Réactivation après absence';
      default:
        return type;
    }
  }

  classeStatut(statut: DemandeReportStatus): string {
    switch (statut) {
      case DemandeReportStatus.EN_ATTENTE:
        return 'badge-attente';
      case DemandeReportStatus.ACCEPTEE:
        return 'badge-acceptee';
      case DemandeReportStatus.REFUSEE:
        return 'badge-refusee';
      default:
        return '';
    }
  }

  trackByDemandeId(_index: number, demande: Reprogrammer): string {
    return demande.id ?? _index.toString();
  }
}
