import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { DashboardStatsDto, MonthDataDto } from '../../../core/models/statsRH';
import { StatsRHService } from '../../../core/service/stats-rh.service';
import {
  RecrutementWebSocketService,

} from '../../../core/service/recrutement-web-socket.service';
import {
  WebSocketService,

} from '../../../core/service/web-socket.service';
import { AuthService } from '../../../core/service/auth.service';
import { UserProfileResponse } from '../../../core/models/UserProfileResponse';
import { AdminRealtimeEvent } from '../../../core/models/websocket';
import { RecrutementRealtimeEvent } from '../../../core/models/websocket-recrutement';

Chart.register(...registerables);

const MONTH_LABELS = [
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
const PALETTE = [
  '#4a6cf7',
  '#1d9e75',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f472b6',
  '#84cc16',
  '#6366f1',
  '#94a3b8',
];

interface LegendItem {
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface NotificationItem {
  id: string;
  type: string;
  text: string;
  time: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-rh',
  templateUrl: './dashboard-rh.component.html',
  styleUrls: ['./dashboard-rh.component.css'],
})
export class DashboardRHComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statutChart') statutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('departementChart')
  departementChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeEntretienChart')
  typeEntretienChartRef!: ElementRef<HTMLCanvasElement>;

  data: DashboardStatsDto | null = null;
  isLoading = false;
  errorMessage = '';
  candidaturesStatutLegend: LegendItem[] = [];
  postesDepartementLegend: LegendItem[] = [];
  entretiensTypeLegend: LegendItem[] = [];
  entretiensStatutLegend: LegendItem[] = [];
  postesStatutLegend: LegendItem[] = [];
  reprogrammationsStatutLegend: LegendItem[] = [];
  reprogrammationsTypeLegend: LegendItem[] = [];
  notifications: NotificationItem[] = [];
  unreadNotifications = 0;
  showNotificationToast = false;
  lastNotification: NotificationItem | null = null;
  wsStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' =
    'DISCONNECTED';
  private currentUserKeycloakId?: string;
  private lineChart: Chart | null = null;
  private statutChart: Chart | null = null;
  private departementChart: Chart | null = null;
  private typeEntretienChart: Chart | null = null;
  private chartsReady = false;
  private pendingChartUpdate = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly statsRHService: StatsRHService,
    private readonly recrutementWsService: RecrutementWebSocketService,
    private readonly webSocketService: WebSocketService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadUserProfile();
    this.initWebSockets();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
      this.chartsReady = true;
      if (this.pendingChartUpdate && this.data) {
        this.updateCharts();
        this.pendingChartUpdate = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.recrutementWsService.disconnect();
    this.webSocketService.disconnect();
    this.destroyCharts();
  }

  private loadUserProfile(): void {
    this.authService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: UserProfileResponse) => {
this.currentUserKeycloakId = profile.KeycloakId;          if (this.currentUserKeycloakId) {
            this.initWebSockets();
          }
        },
        error: () => console.error('Erreur chargement profil'),
      });
  }

  private initWebSockets(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn(
        'Pas de token JWT disponible, impossible de se connecter au WebSocket',
      );
      console.log('pas de toekn ')
      return; 
    }

    this.webSocketService.connect(token, 'RH');
    this.recrutementWsService.connect(token, 'RH', this.currentUserKeycloakId);

    this.webSocketService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: AdminRealtimeEvent) => {
        this.handleAdminEvent(event);
      });

    this.recrutementWsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: RecrutementRealtimeEvent) => {
        this.handleRecrutementEvent(event);
      });

    this.webSocketService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.wsStatus = status;
      });
  }

  private handleAdminEvent(event: AdminRealtimeEvent): void {
    this.addNotificationFromAdminEvent(event);
    this.refreshIfNeeded(event);
  }

  private handleRecrutementEvent(event: RecrutementRealtimeEvent): void {
    this.addNotificationFromRecrutementEvent(event);
    this.refreshIfNeeded(event);
  }

  private refreshIfNeeded(
    event: AdminRealtimeEvent | RecrutementRealtimeEvent,
  ): void {
    const relevantTypes = [
      'STATS_UPDATE',
      'NEW_APPLICATION',
      'APPLICATION_STATUS_CHANGED',
      'INTERVIEW_PLANIFIE',
      'INTERVIEW_REPORTE',
      'INTERVIEW_ANNULE',
      'INTERVIEW_ABSENT',
      'INTERVIEW_RESULTAT',
      'NEW_POSTE',
      'POSTE_STATUS_CHANGED',
      'REPROGRAMMATION_DEMANDEE',
      'REPROGRAMMATION_TRAITEE',
    ];
    if (relevantTypes.includes(event.type as any)) {
      this.loadDashboard();
    }
  }

  private addNotificationFromAdminEvent(event: AdminRealtimeEvent): void {
    const notification: NotificationItem = {
      id: Date.now().toString(),
      type: event.type,
      text: this.buildAdminNotificationText(event),
      time: new Date(event.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      color: this.getAdminEventColor(event.type),
      icon: this.getAdminEventIcon(event.type),
    };
    this.notifications.unshift(notification);
    this.unreadNotifications++;
    this.lastNotification = notification;
    this.showNotificationToast = true;
    setTimeout(() => (this.showNotificationToast = false), 5000);
  }

  private addNotificationFromRecrutementEvent(
    event: RecrutementRealtimeEvent,
  ): void {
    const notification: NotificationItem = {
      id: Date.now().toString(),
      type: event.type,
      text: this.buildRecrutementNotificationText(event),
      time: new Date(event.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      color: this.getRecrutementEventColor(event.type),
      icon: this.getRecrutementEventIcon(event.type),
    };
    this.notifications.unshift(notification);
    this.unreadNotifications++;
    this.lastNotification = notification;
    this.showNotificationToast = true;
    setTimeout(() => (this.showNotificationToast = false), 5000);
  }

  private buildAdminNotificationText(event: AdminRealtimeEvent): string {
    const p = event.payload as any;
    switch (event.type) {
      case 'NEW_USER':
        return `Nouveau compte ${p?.role ?? ''} : ${p?.prenom ?? ''} ${p?.nom ?? ''}`;
      case 'CESSATION':
        return `Compte suspendu : ${p?.prenom ?? ''} ${p?.nom ?? ''}`;
      case 'REACTIVATION':
        return `Compte réactivé : ${p?.prenom ?? ''} ${p?.nom ?? ''}`;
      case 'STATS_UPDATE':
        return 'Statistiques mises à jour';
      default:
        return 'Nouvel événement';
    }
  }

  private buildRecrutementNotificationText(
    event: RecrutementRealtimeEvent,
  ): string {
    const p = event.payload as any;
    switch (event.type) {
      case 'NEW_POSTE':
        return `Nouveau poste : ${p?.titre ?? ''}`;
      case 'POSTE_STATUS_CHANGED':
        return `Poste "${p?.titre ?? ''}" : ${p?.ancienStatus ?? '?'} → ${p?.nouveauStatus ?? ''}`;
      case 'NEW_APPLICATION':
        return `Nouvelle candidature : ${p?.candidateName ?? ''} sur ${p?.posteTitre ?? ''}`;
      case 'APPLICATION_STATUS_CHANGED':
        return `Candidature ${p?.candidateName ?? ''} : ${p?.ancienStatut ?? '?'} → ${p?.nouveauStatut ?? ''}`;
      case 'INTERVIEW_PLANIFIE':
        return `Entretien planifié : ${p?.candidateName ?? ''}`;
      case 'INTERVIEW_REPORTE':
        return `Entretien reporté : ${p?.candidateName ?? ''}`;
      case 'INTERVIEW_ANNULE':
        return `Entretien annulé : ${p?.candidateName ?? ''}`;
      case 'INTERVIEW_ABSENT':
        return `Candidat absent : ${p?.candidateName ?? ''}`;
      case 'INTERVIEW_RESULTAT':
        return `Résultat entretien : ${p?.resultat ?? ''} (${p?.candidateName ?? ''})`;
      case 'REPROGRAMMATION_DEMANDEE':
        return `Demande de report reçue : ${p?.motif ?? ''}`;
      case 'REPROGRAMMATION_TRAITEE':
        return `Demande de report ${p?.statut === 'ACCEPTEE' ? 'acceptée' : 'refusée'}`;
      default:
        return 'Nouvel événement recrutement';
    }
  }

  private getAdminEventColor(type: string): string {
    const colors: Record<string, string> = {
      STATS_UPDATE: '#4a6cf7',
      NEW_USER: '#1D9E75',
      CESSATION: '#ef4444',
      REACTIVATION: '#0ea5e9',
      LOGIN_ACTIVITY: '#8b5cf6',
      CERTIFICATION: '#f59e0b',
      NEW_POSTE: '#6366f1',
      NEW_DEPARTEMENT: '#0ea5e9',
      DEMANDE_CONGE: '#f97316',
    };
    return colors[type] ?? '#64748b';
  }

  private getRecrutementEventColor(type: string): string {
    const colors: Record<string, string> = {
      NEW_POSTE: '#6366f1',
      POSTE_STATUS_CHANGED: '#0ea5e9',
      NEW_APPLICATION: '#1D9E75',
      APPLICATION_STATUS_CHANGED: '#4a6cf7',
      INTERVIEW_PLANIFIE: '#10b981',
      INTERVIEW_REPORTE: '#f59e0b',
      INTERVIEW_ANNULE: '#ef4444',
      INTERVIEW_ABSENT: '#ef4444',
      INTERVIEW_RESULTAT: '#8b5cf6',
      REPROGRAMMATION_DEMANDEE: '#f97316',
      REPROGRAMMATION_TRAITEE: '#0891b2',
    };
    return colors[type] ?? '#64748b';
  }

  private getAdminEventIcon(type: string): string {
    const icons: Record<string, string> = {
      STATS_UPDATE: 'fa-chart-line',
      NEW_USER: 'fa-user-plus',
      CESSATION: 'fa-user-xmark',
      REACTIVATION: 'fa-user-check',
      LOGIN_ACTIVITY: 'fa-right-to-bracket',
      CERTIFICATION: 'fa-certificate',
      NEW_POSTE: 'fa-briefcase',
      NEW_DEPARTEMENT: 'fa-building',
      DEMANDE_CONGE: 'fa-calendar-days',
    };
    return icons[type] ?? 'fa-bell';
  }

  private getRecrutementEventIcon(type: string): string {
    const icons: Record<string, string> = {
      NEW_POSTE: 'fa-briefcase',
      POSTE_STATUS_CHANGED: 'fa-briefcase',
      NEW_APPLICATION: 'fa-file-circle-plus',
      APPLICATION_STATUS_CHANGED: 'fa-arrow-right-arrow-left',
      INTERVIEW_PLANIFIE: 'fa-calendar-check',
      INTERVIEW_REPORTE: 'fa-calendar-days',
      INTERVIEW_ANNULE: 'fa-calendar-xmark',
      INTERVIEW_ABSENT: 'fa-user-xmark',
      INTERVIEW_RESULTAT: 'fa-clipboard-check',
      REPROGRAMMATION_DEMANDEE: 'fa-clock-rotate-left',
      REPROGRAMMATION_TRAITEE: 'fa-check-double',
    };
    return icons[type] ?? 'fa-bell';
  }

  markAsRead(): void {
    this.unreadNotifications = 0;
    this.showNotificationToast = false;
  }

  dismissNotificationToast(): void {
    this.showNotificationToast = false;
  }

  loadDashboard(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.statsRHService
      .getDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dto: DashboardStatsDto) => {
          this.data = dto;
          this.buildLegends();
          if (this.chartsReady) this.updateCharts();
          else this.pendingChartUpdate = true;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Impossible de charger les statistiques.';
          this.isLoading = false;
        },
      });
  }

  refresh(): void {
    this.loadDashboard();
  }

  isUp(value: number): boolean {
    return Number.isFinite(Number(value)) && Number(value) >= 0;
  }

  isDown(value: number): boolean {
    return Number.isFinite(Number(value)) && Number(value) < 0;
  }

  formatVariation(value: number): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '—';
    const rounded = Math.round(numericValue * 10) / 10;
    return rounded >= 0 ? `+${rounded}% ce mois` : `${rounded}% ce mois`;
  }

  formatPct(value: number): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '0%';
    return `${Math.round(numericValue * 10) / 10}%`;
  }

  formatNumber(value: number | null | undefined): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '0';
    return new Intl.NumberFormat('fr-FR').format(numericValue);
  }

  getProgressWidth(value: number, items: LegendItem[]): number {
    const maximum = Math.max(...items.map((item) => item.value), 1);
    return Math.min(100, Math.max(0, (value / maximum) * 100));
  }

  trackLegend(_index: number, item: LegendItem): string {
    return item.label;
  }

  get applicationsTraitees(): number {
    if (!this.data) return 0;
    const statuts = this.data.applications.parStatut;
    return (
      Number(statuts['ACCEPTE'] ?? 0) +
      Number(statuts['REJETE'] ?? 0) +
      Number(statuts['RETIRE'] ?? 0)
    );
  }

  get entretiensActifs(): number {
    if (!this.data) return 0;
    const statuts = this.data.interviews.parStatut;
    return (
      Number(statuts['PLANIFIE'] ?? 0) +
      Number(statuts['CONFIRME'] ?? 0) +
      Number(statuts['EN_COURS'] ?? 0) +
      Number(statuts['REPORTE'] ?? 0)
    );
  }

  get entretiensTermines(): number {
    if (!this.data) return 0;
    return Number(this.data.interviews.parStatut['TERMINE'] ?? 0);
  }

  get candidaturesEnCours(): number {
    if (!this.data) return 0;
    const statuts = this.data.applications.parStatut;
    return (
      Number(statuts['EN_ATTENTE'] ?? 0) +
      Number(statuts['SELECTIONNE'] ?? 0) +
      Number(statuts['EN_ENTRETIEN_RH'] ?? 0) +
      Number(statuts['EN_ENTRETIEN_TECHNIQUE'] ?? 0) +
      Number(statuts['EN_ENTRETIEN_FINAL'] ?? 0)
    );
  }

  get postesNonOuverts(): number {
    if (!this.data) return 0;
    const statuts = this.data.postes.parStatut;
    return Number(statuts['EXPIRE'] ?? 0) + Number(statuts['FERME'] ?? 0);
  }

  private buildLegends(): void {
    if (!this.data) {
      this.clearLegends();
      return;
    }
    this.candidaturesStatutLegend = this.mapToLegend(
      this.data.applications.parStatut,
    );
    this.postesDepartementLegend = this.mapToLegend(
      this.data.postes.parDepartement,
    );
    this.entretiensTypeLegend = this.mapToLegend(this.data.interviews.parType);
    this.entretiensStatutLegend = this.mapToLegend(
      this.data.interviews.parStatut,
    );
    this.postesStatutLegend = this.mapToLegend(this.data.postes.parStatut);
    this.reprogrammationsStatutLegend = this.mapToLegend(
      this.data.reprogrammations.parStatut,
    );
    this.reprogrammationsTypeLegend = this.mapToLegend(
      this.data.reprogrammations.parType,
    );
  }

  private clearLegends(): void {
    this.candidaturesStatutLegend = [];
    this.postesDepartementLegend = [];
    this.entretiensTypeLegend = [];
    this.entretiensStatutLegend = [];
    this.postesStatutLegend = [];
    this.reprogrammationsStatutLegend = [];
    this.reprogrammationsTypeLegend = [];
  }

  private mapToLegend(
    map: Record<string, number> | null | undefined,
  ): LegendItem[] {
    if (!map) return [];
    const entries = Object.entries(map)
      .map(([label, rawValue]) => ({
        label: this.formatLabel(label),
        value: Number(rawValue),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0);
    const total = entries.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return [];
    return entries.map((item, index) => ({
      label: item.label,
      value: item.value,
      pct: Math.round((item.value / total) * 100),
      color: PALETTE[index % PALETTE.length],
    }));
  }

  private formatLabel(label: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      SELECTIONNE: 'Sélectionnée',
      EN_ENTRETIEN_RH: 'Entretien RH',
      EN_ENTRETIEN_TECHNIQUE: 'Entretien technique',
      EN_ENTRETIEN_FINAL: 'Entretien final',
      ACCEPTE: 'Acceptée',
      REJETE: 'Rejetée',
      RETIRE: 'Retirée',
      RH_INITIAL: 'Entretien RH initial',
      TECHNIQUE: 'Entretien technique',
      RH_FINAL: 'Entretien RH final',
      LIBRE: 'Entretien libre',
      PLANIFIE: 'Planifié',
      CONFIRME: 'Confirmé',
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
      REPORTE: 'Reporté',
      ABSENT: 'Candidat absent',
      OUVERT: 'Ouvert',
      EXPIRE: 'Expiré',
      FERME: 'Fermé',
      ACCEPTEE: 'Acceptée',
      REFUSEE: 'Refusée',
      DEMANDE_CANDIDAT: 'Demande du candidat',
      PROPOSITION_INTERVENANT: 'Proposition de l’intervenant',
      REACTIVATION_APRES_ABSENCE: 'Réactivation après absence',
      NON_DEFINI: 'Département non défini',
      INCONNU: 'Information non renseignée',
    };
    return labels[label] ?? label.replace(/_/g, ' ');
  }

  private initCharts(): void {
    this.destroyCharts();
    this.buildLineChart();
    this.buildStatutChart();
    this.buildDepartementChart();
    this.buildTypeEntretienChart();
  }

  private buildLineChart(): void {
    const canvas = this.lineChartRef?.nativeElement;
    if (!canvas) return;
    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: 'Candidatures',
            data: [],
            borderColor: '#4a6cf7',
            backgroundColor: 'rgba(74, 108, 247, 0.07)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Entretiens',
            data: [],
            borderColor: '#1d9e75',
            backgroundColor: 'rgba(29, 158, 117, 0.07)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Postes publiés',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Reprogrammations',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [6, 4],
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 11 } },
          },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            grid: { color: 'rgba(74, 108, 247, 0.06)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(74, 108, 247, 0.06)' },
            ticks: { color: '#94a3b8', precision: 0, font: { size: 11 } },
          },
        },
      },
    });
  }

  private buildStatutChart(): void {
    const canvas = this.statutChartRef?.nativeElement;
    if (!canvas) return;
    this.statutChart = new Chart(canvas, {
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
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw) || 0;
                const values = context.dataset.data.map(
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

  private buildDepartementChart(): void {
    const canvas = this.departementChartRef?.nativeElement;
    if (!canvas) return;
    this.departementChart = this.createBarChart(canvas);
  }

  private buildTypeEntretienChart(): void {
    const canvas = this.typeEntretienChartRef?.nativeElement;
    if (!canvas) return;
    this.typeEntretienChart = this.createBarChart(canvas);
  }

  private createBarChart(canvas: HTMLCanvasElement): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Total',
            data: [],
            backgroundColor: [],
            borderRadius: 6,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(74, 108, 247, 0.06)' },
            ticks: { color: '#94a3b8', precision: 0, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#334155', font: { size: 11 } },
          },
        },
      },
    });
  }

  private updateCharts(): void {
    if (!this.data) return;
    this.updateLineChart();
    this.updateStatutChart();
    this.updateDepartementChart();
    this.updateTypeEntretienChart();
  }

  private updateLineChart(): void {
    if (!this.data || !this.lineChart) return;
    this.lineChart.data.datasets[0].data = this.toMonthArray(
      this.data.applications.serieMensuelle,
    );
    this.lineChart.data.datasets[1].data = this.toMonthArray(
      this.data.interviews.serieMensuelle,
    );
    this.lineChart.data.datasets[2].data = this.toMonthArray(
      this.data.postes.serieMensuelle,
    );
    this.lineChart.data.datasets[3].data = this.toMonthArray(
      this.data.reprogrammations.serieMensuelle,
    );
    this.lineChart.update();
  }

  private updateStatutChart(): void {
    if (!this.statutChart) return;
    this.statutChart.data.labels = this.candidaturesStatutLegend.map(
      (item) => item.label,
    );
    this.statutChart.data.datasets[0].data = this.candidaturesStatutLegend.map(
      (item) => item.value,
    );
    this.statutChart.data.datasets[0].backgroundColor =
      this.candidaturesStatutLegend.map((item) => item.color);
    this.statutChart.update();
  }

  private updateDepartementChart(): void {
    if (!this.departementChart) return;
    this.departementChart.data.labels = this.postesDepartementLegend.map(
      (item) => item.label,
    );
    this.departementChart.data.datasets[0].data =
      this.postesDepartementLegend.map((item) => item.value);
    this.departementChart.data.datasets[0].backgroundColor =
      this.postesDepartementLegend.map((item) => item.color);
    this.departementChart.update();
  }

  private updateTypeEntretienChart(): void {
    if (!this.typeEntretienChart) return;
    this.typeEntretienChart.data.labels = this.entretiensTypeLegend.map(
      (item) => item.label,
    );
    this.typeEntretienChart.data.datasets[0].data =
      this.entretiensTypeLegend.map((item) => item.value);
    this.typeEntretienChart.data.datasets[0].backgroundColor =
      this.entretiensTypeLegend.map((item) => item.color);
    this.typeEntretienChart.update();
  }

  private toMonthArray(serie: MonthDataDto[] | null | undefined): number[] {
    const result = new Array<number>(12).fill(0);
    if (!serie) return result;
    for (const item of serie) {
      const mois = Number(item.mois);
      const total = Number(item.total);
      if (
        Number.isInteger(mois) &&
        mois >= 1 &&
        mois <= 12 &&
        Number.isFinite(total)
      ) {
        result[mois - 1] += total;
      }
    }
    return result;
  }

  private destroyCharts(): void {
    this.lineChart?.destroy();
    this.statutChart?.destroy();
    this.departementChart?.destroy();
    this.typeEntretienChart?.destroy();
    this.lineChart = null;
    this.statutChart = null;
    this.departementChart = null;
    this.typeEntretienChart = null;
  }
}
