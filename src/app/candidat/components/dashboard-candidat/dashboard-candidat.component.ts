import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { StatsCandidatService } from '../../../core/service/stats-candidat.service';
import {
  CandidateDashboardStatsDto,
  PosteCandidateItemDto,
  UpcomingInterviewDto,
} from '../../../core/models/candidatstats';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-candidat',
  templateUrl: './dashboard-candidat.component.html',
  styleUrl: './dashboard-candidat.component.css',
})
export class DashboardCandidatComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('lineChart')
  lineChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('doughnutChart')
  doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  private static readonly MONTH_LABELS: string[] = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  private static readonly STATUT_COLORS: Readonly<Record<string, string>> = {
    EN_ATTENTE: '#94a3b8',
    SELECTIONNE: '#8b5cf6',
    EN_ENTRETIEN_RH: '#4a6cf7',
    EN_ENTRETIEN_TECHNIQUE: '#6366f1',
    EN_ENTRETIEN_FINAL: '#f59e0b',
    ACCEPTE: '#1d9e75',
    REJETE: '#ef4444',
    RETIRE: '#cbd5e1',
    INCONNU: '#64748b',
  };

  private static readonly INTERVIEW_STATUT_COLORS: Readonly<
    Record<string, string>
  > = {
    PLANIFIE: '#4a6cf7',
    CONFIRME: '#1d9e75',
    EN_COURS: '#f59e0b',
    TERMINE: '#94a3b8',
    ANNULE: '#ef4444',
    REPORTE: '#8b5cf6',
    ABSENT: '#dc2626',
    INCONNU: '#64748b',
  };

  private readonly destroy$ = new Subject<void>();

  private lineChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  private chartsReady = false;
  private pendingUpdate = false;

  isLoading = false;
  errorMessage: string | null = null;
  dashboard: CandidateDashboardStatsDto | null = null;

  statutLabels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    SELECTIONNE: 'Sélectionnée',
    EN_ENTRETIEN_RH: 'Entretien RH',
    EN_ENTRETIEN_TECHNIQUE: 'Entretien technique',
    EN_ENTRETIEN_FINAL: 'Entretien final',
    ACCEPTE: 'Acceptée',
    REJETE: 'Rejetée',
    RETIRE: 'Retirée',
    INCONNU: 'Non renseigné',
  };

  interviewStatutLabels: Record<string, string> = {
    PLANIFIE: 'Planifié',
    CONFIRME: 'Confirmé',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
    REPORTE: 'Reporté',
    ABSENT: 'Absent',
    INCONNU: 'Non renseigné',
  };

  constructor(
    private readonly statsCandidatService: StatsCandidatService,
    private readonly router: Router,
  ) {}

  // ============================================================
  // Cycle de vie Angular
  // ============================================================

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
      this.chartsReady = true;

      if (this.pendingUpdate) {
        this.updateCharts();
        this.pendingUpdate = false;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.lineChart?.destroy();
    this.doughnutChart?.destroy();

    this.lineChart = null;
    this.doughnutChart = null;
  }

  // ============================================================
  // Chargement des données
  // ============================================================

  loadDashboard(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.statsCandidatService
      .getDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: CandidateDashboardStatsDto) => {
          this.dashboard = data;
          this.isLoading = false;

          if (this.chartsReady) {
            this.updateCharts();
          } else {
            this.pendingUpdate = true;
          }
        },
        error: (error: any) => {
          console.log(error);
          console.error('Erreur chargement dashboard candidat :', error);

          this.errorMessage =
            'Impossible de charger vos statistiques pour le moment.';

          this.isLoading = false;
        },
      });
  }

  refresh(): void {
    this.loadDashboard();
  }

  // ============================================================
  // Initialisation des graphiques
  // ============================================================

  private initCharts(): void {
    this.buildLineChart();
    this.buildDoughnutChart();
  }

  private buildLineChart(): void {
    const canvas = this.lineChartRef?.nativeElement;

    if (!canvas) {
      return;
    }

    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: DashboardCandidatComponent.MONTH_LABELS,
        datasets: [
          {
            label: 'Mes candidatures',
            data: [],
            borderColor: '#4a6cf7',
            backgroundColor: 'rgba(74, 108, 247, 0.08)',
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(74, 108, 247, 0.06)',
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(74, 108, 247, 0.06)',
            },
            ticks: {
              color: '#94a3b8',
              precision: 0,
              font: {
                size: 11,
              },
            },
          },
        },
      },
    });
  }

  private buildDoughnutChart(): void {
    const canvas = this.doughnutChartRef?.nativeElement;

    if (!canvas) {
      return;
    }

    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        animation: {
          duration: 600,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw) || 0;

                const values = Array.from(context.dataset.data).map(
                  (item) => Number(item) || 0,
                );

                const total = values.reduce((sum, item) => sum + item, 0);

                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;

                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  // ============================================================
  // Mise à jour des graphiques
  // ============================================================

  private updateCharts(): void {
    if (!this.dashboard) {
      return;
    }

    this.updateLineChart();
    this.updateDoughnutChart();
  }

  private updateLineChart(): void {
    if (!this.dashboard || !this.lineChart) {
      return;
    }

    const serie = this.dashboard.applications.serieMensuelle ?? [];

    const values = serie.map((item) => Number(item.total) || 0);

    this.lineChart.data.labels = DashboardCandidatComponent.MONTH_LABELS;

    this.lineChart.data.datasets[0].data = values;

    this.lineChart.update();
  }

  private updateDoughnutChart(): void {
    if (!this.dashboard || !this.doughnutChart) {
      return;
    }

    const parStatut = this.dashboard.applications.parStatut ?? {};

    const entries = Object.entries(parStatut)
      .map(([key, rawValue]) => ({
        key,
        value: Number(rawValue) || 0,
      }))
      .filter((item) => item.value > 0);

    this.doughnutChart.data.labels = entries.map(
      (item) => this.statutLabels[item.key] ?? item.key,
    );

    this.doughnutChart.data.datasets[0].data = entries.map(
      (item) => item.value,
    );

    this.doughnutChart.data.datasets[0].backgroundColor = entries.map(
      (item) => DashboardCandidatComponent.STATUT_COLORS[item.key] ?? '#9ca3af',
    );

    this.doughnutChart.update();
  }

  // ============================================================
  // Statistiques de candidature
  // ============================================================

  get applicationsParStatutList(): {
    key: string;
    label: string;
    total: number;
    color: string;
  }[] {
    if (!this.dashboard) {
      return [];
    }

    const parStatut = this.dashboard.applications.parStatut ?? {};

    return Object.entries(parStatut)
      .map(([key, rawValue]) => ({
        key,
        label: this.statutLabels[key] ?? key,
        total: Number(rawValue) || 0,
        color: DashboardCandidatComponent.STATUT_COLORS[key] ?? '#9ca3af',
      }))
      .filter((item) => item.total > 0);
  }

  // ============================================================
  // Statistiques d'entretien
  // ============================================================

  interviewStatutLabel(statut: string | null | undefined): string {
    if (!statut) {
      return 'Non renseigné';
    }

    return this.interviewStatutLabels[statut] ?? statut;
  }

  interviewStatutColor(statut: string | null | undefined): string {
    if (!statut) {
      return '#9ca3af';
    }

    return (
      DashboardCandidatComponent.INTERVIEW_STATUT_COLORS[statut] ?? '#9ca3af'
    );
  }

  interviewModeLabel(mode: string | null | undefined): string {
    if (!mode) {
      return 'Non renseigné';
    }

    const labels: Record<string, string> = {
      PRESENTIEL: 'Présentiel',
      DISTANCIEL: 'Distanciel',
      TELEPHONIQUE: 'Téléphonique',
    };

    return labels[mode] ?? mode;
  }

  // ============================================================
  // Statistiques des postes
  // ============================================================

  workTypeLabel(type: string | null | undefined): string {
    if (!type) {
      return 'Non renseigné';
    }

    const labels: Record<string, string> = {
      SUR_SITE: 'Sur site',
      HYBRIDE: 'Hybride',
      DISTANCE: 'Télétravail',
    };

    return labels[type] ?? type;
  }

  isExpiringSoon(poste: PosteCandidateItemDto): boolean {
    if (!poste.dateExpirationPosteRecrutement) {
      return false;
    }

    const expiration = new Date(poste.dateExpirationPosteRecrutement).getTime();

    if (!Number.isFinite(expiration)) {
      return false;
    }

    const maintenant = Date.now();

    const dansSeptJours = maintenant + 7 * 24 * 60 * 60 * 1000;

    return expiration >= maintenant && expiration <= dansSeptJours;
  }

  // ============================================================
  // ROUTES CANDIDAT CORRIGÉES
  // ============================================================

  /*
   * Route réelle :
   * /candidat/consulterlesPosteDisponibles
   */
  goToPostesDisponibles(): void {
    this.router.navigate(['/candidat', 'consulterlesPosteDisponibles']);
  }

  /*
   * Route réelle :
   * /candidat/consulterspecifiPosteDisponibless/:id
   */
  goToPoste(poste: PosteCandidateItemDto): void {
    if (!poste.idPosteRecrutement) {
      return;
    }

    this.router.navigate([
      '/candidat',
      'consulterspecifiPosteDisponibless',
      poste.idPosteRecrutement,
    ]);
  }

  /*
   * Route réelle pour les candidatures :
   * /candidat/MesCandidatures
   */
  goToApplications(): void {
    this.router.navigate(['/candidat', 'MesCandidatures']);
  }

  /*
   * Il n'existe pas de route /candidat/entretiens/:id
   * dans votre routing actuel.
   *
   * On redirige donc vers le calendrier candidat.
   */
  goToInterview(interview: UpcomingInterviewDto): void {
    this.router.navigate(['/candidat', 'calendrierCandidat']);
  }

  /*
   * Navigation vers le calendrier candidat.
   */
  goToCalendrier(): void {
    this.router.navigate(['/candidat', 'calendrierCandidat']);
  }

  /*
   * Navigation vers le détail d'une candidature.
   * Utilisez applicationId comme paramètre :id.
   */
  goToApplicationDetail(applicationId: string | null | undefined): void {
    if (!applicationId) {
      return;
    }

    this.router.navigate([
      '/candidat',
      'consulterEtatEthistoriqueParDetailleDuneCandidatureSpecifique',
      applicationId,
    ]);
  }

  /*
   * Navigation vers une demande de reprogrammation.
   */
  goToReprogrammer(
    applicationId: string | null | undefined,
    interviewId: string | null | undefined,
  ): void {
    if (!applicationId || !interviewId) {
      return;
    }

    this.router.navigate([
      '/candidat',
      'consulterEtatEthistoriqueParDetailleDuneCandidatureSpecifique',
      applicationId,
      'reprogrammer',
      interviewId,
    ]);
  }
}
