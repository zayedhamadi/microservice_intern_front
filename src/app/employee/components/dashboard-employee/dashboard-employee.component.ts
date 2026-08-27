import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

import {
  ConnectionStatus,
  AdminRealtimeEvent,
} from '../../../core/models/websocket';
import {
  RecrutementRealtimeEvent,
  buildRecrutementNotificationText,
  recrutementEventIcon,
  recrutementEventColor,
} from '../../../core/models/websocket-recrutement';
import { StatsPayload } from '../../../core/models/userstatistics';
import { AuthService } from '../../../core/service/auth.service';
import { UserService } from '../../../core/service/user.service';
import {
  eventColor,
  wsStatusLabel,
  wsStatusClass,
  eventIcon,
  WebSocketService,
} from '../../../core/service/web-socket.service';
import { RecrutementWebSocketService } from '../../../core/service/recrutement-web-socket.service';
import { StatsService } from '../../../core/service/stats.service';
import { UserProfileResponse } from '../../../core/models/UserProfileResponse';
import { UserCommonProfile } from '../../../core/models/userConneccted';

Chart.register(...registerables);

// Interface pour les éléments d'activité
interface ActivityItem {
  type: string;
  message: string;
  role: string | null;
  actorPrenom: string | null;
  actorNom: string | null;
  motif: string | null;
  createdAt: string;
}

// Interface pour les utilisateurs récents
interface RecentUser {
  id: number;
  matricule: string;
  cin: string | number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  etatCompte: string;
  dateInscrit: string;
  image: string | null;
  imageLoading: boolean;
}

// Interface pour la répartition des rôles
interface RoleDistribution {
  label: string;
  role: string;
  pct: number;
  color: string;
}

// Interface pour l'affichage des activités
interface ActivityDisplay {
  text: string;
  time: string;
  color: string;
}

type RealtimeEventUnion = AdminRealtimeEvent | RecrutementRealtimeEvent;
type EventKind = 'admin' | 'recrutement';

@Component({
  selector: 'app-dashboard-employee',
  templateUrl: './dashboard-employee.component.html',
  styleUrls: ['./dashboard-employee.component.css'],
})
export class DashboardEmployeeComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  // Couleurs des rôles
  private static readonly ROLE_COLORS: Readonly<Record<string, string>> = {
    RH: '#1D9E75',
    EMPLOYEE: '#f59e0b',
    CANDIDAT: '#4a6cf7',
    ADMIN: '#4f46e5',
    MANAGER: '#065f46',
  };

  // Mois pour les graphiques
  private static readonly MONTH_LABELS = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  // Titres des toasts pour les événements admin
  private static readonly ADMIN_TOAST_TITLES: Record<string, string> = {
    NEW_USER: 'Nouvel utilisateur',
    CESSATION: 'Compte suspendu',
    REACTIVATION: 'Compte réactivé',
    LOGIN_ACTIVITY: 'Connexion détectée',
    CERTIFICATION: 'Certification',
    DEMANDE_CONGE: 'Demande de congé',
    STATS_UPDATE: 'Mise à jour des statistiques',
  };

  // Tableau des graphiques
  private charts: Chart[] = [];
  private chartsReady = false;
  private pendingUpdate: (() => void) | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  // Statut de connexion WebSocket
  wsStatus: ConnectionStatus = 'DISCONNECTED';
  lastEvent: RealtimeEventUnion | null = null;
  lastEventKind: EventKind = 'admin';
  showToast = false;

  // Statut de chargement
  isLoading = false;
  isLoadingActivities = false;

  // Date actuelle
  today = new Date();

  // Profil utilisateur
  profile: UserProfileResponse | null = null;
  private keycloakId?: string;

  // Statistiques
  stats = {
    totalUsers: 0,
    deltaUsers: 0,
    totalRH: 0,
    deltaRH: 0,
    totalEmployees: 0,
    deltaEmployees: 0,
    totalCandidats: 0,
    deltaCandidats: 0,
    totalInactifs: 0,
    deltaInactifs: 0,
  };

  // Utilisateurs récents
  recentUsers: RecentUser[] = [];

  // Répartition des rôles
  roleDistribution: RoleDistribution[] = [
    { label: 'RH', role: 'RH', pct: 0, color: '#1D9E75' },
    { label: 'Employés', role: 'EMPLOYEE', pct: 0, color: '#f59e0b' },
    { label: 'Candidats', role: 'CANDIDAT', pct: 0, color: '#4a6cf7' },
  ];

  // Activités récentes
  activities: ActivityDisplay[] = [];

  // Données mensuelles
  private monthlyData: Record<string, number[]> = {};
  private inscrCessData = {
    inscriptions: [] as number[],
    cessations: [] as number[],
  };

  // Pagination des activités
  actPage = 1;
  actPageSize = 5;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly statsService: StatsService,
    private readonly wsService: WebSocketService,
    private readonly recrutementWsService: RecrutementWebSocketService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadStats();
    this.loadActivities();
    this.initWebSocket();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
      this.chartsReady = true;
      if (this.pendingUpdate) {
        this.pendingUpdate();
        this.pendingUpdate = null;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.charts.forEach((c) => c.destroy());
    this.wsService.disconnect();
    this.recrutementWsService.disconnect();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // Pagination des activités
  get pagedActivities(): ActivityDisplay[] {
    const start = (this.actPage - 1) * this.actPageSize;
    return this.activities.slice(start, start + this.actPageSize);
  }

  get actTotalPages(): number {
    return Math.max(1, Math.ceil(this.activities.length / this.actPageSize));
  }

  get actRangeStart(): number {
    return this.activities.length === 0
      ? 0
      : (this.actPage - 1) * this.actPageSize + 1;
  }

  get actRangeEnd(): number {
    return Math.min(this.actPage * this.actPageSize, this.activities.length);
  }

  get actVisiblePages(): number[] {
    const pages: number[] = [];
    const total = this.actTotalPages;
    const cur = this.actPage;
    const from = Math.max(2, cur - 1);
    const to = Math.min(total - 1, cur + 1);

    pages.push(1);
    if (from > 2) pages.push(-1);
    for (let i = from; i <= to; i++) pages.push(i);
    if (to < total - 1) pages.push(-1);
    if (total > 1) pages.push(total);

    return pages;
  }

  goToActPage(pg: number): void {
    if (pg >= 1 && pg <= this.actTotalPages) this.actPage = pg;
  }

  // Chargement du profil utilisateur
  loadProfile(): void {
    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.profile = this.mapToProfileResponse(p);
          this.keycloakId = p.keycloakId;
          this.initRecrutementWebSocket(); // Initialiser après avoir le keycloakId
        },
        error: () => {
          this.profile = null;
          console.error('Erreur lors du chargement du profil');
        },
      });
  }

  private mapToProfileResponse(p: UserCommonProfile): UserProfileResponse {
    return {
      id: p.id,
      matricule: p.matricule ?? null,
      nom: p.nom,
      prenom: p.prenom,
      email: p.email,
      role: p.role as UserProfileResponse['role'],
      etatCompte: p.etatCompte,
      image: p.imageBase64 || null,
      numTel: p.num_Tel != null ? String(p.num_Tel) : null,
      adresse: p.adresse ?? null,
      genre: p.genre ?? null,
      dateNaissance: p.dateNaissance ?? null,
    };
  }

  // Chargement des statistiques
  loadStats(): void {
    this.isLoading = true;

    forkJoin({
      users: this.statsService.getUsersStats(),
      rh: this.statsService.getRHStats(),
      employees: this.statsService.getEmployeesStats(),
      candidats: this.statsService.getCandidatsStats(),
      inactifs: this.statsService.getInactifsStats(),
      monthly: this.statsService.getMonthlyRegistrations(),
      inscrCess: this.statsService.getMonthlyInscrVsCessation(),
      last5: this.statsService.getLast5Users(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Données statistiques reçues:', data);
          this.applyStatsPayload(data as unknown as StatsPayload);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des statistiques:', err);
          this.isLoading = false;
        },
      });
  }

  // Chargement des activités
  loadActivities(): void {
    this.isLoadingActivities = true;

    this.statsService
      .getActivities(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ActivityItem[]) => {
          console.log('Activités reçues:', data);
          if (!data || data.length === 0) {
            console.warn('Aucune activité reçue du backend');
            this.activities = [];
            this.actPage = 1;
            this.isLoadingActivities = false;
            return;
          }

          this.activities = data.map((a) => ({
            text: this.buildActivityText(a),
            time: this.formatTime(a.createdAt),
            color: eventColor(a.type),
          }));
          this.actPage = 1; // Réinitialiser la page
          this.isLoadingActivities = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des activités:', err);
          this.activities = [];
          this.actPage = 1;
          this.isLoadingActivities = false;
        },
      });
  }

  // Construction du texte des activités
  private buildActivityText(a: ActivityItem): string {
    const map: Record<string, string> = {
      NEW_USER: `Nouveau compte <strong>${a.role ?? ''}</strong> : ${a.actorPrenom ?? ''} ${a.actorNom ?? ''}`,
      CESSATION: `Compte suspendu : <strong>${a.actorPrenom ?? ''} ${a.actorNom ?? ''}</strong>`,
      REACTIVATION: `Compte réactivé : <strong>${a.actorPrenom ?? ''} ${a.actorNom ?? ''}</strong>`,
      LOGIN_ACTIVITY: `Connexion : <strong>${a.actorPrenom ?? ''} ${a.actorNom ?? ''}</strong>`,
      CERTIFICATION: `Certification <strong>${a.motif ?? ''}</strong> — ${a.actorPrenom ?? ''} ${a.actorNom ?? ''}`,
      DEMANDE_CONGE: `Demande de congé : <strong>${a.actorPrenom ?? ''} ${a.actorNom ?? ''}</strong>`,
      STATS_UPDATE: `Statistiques mises à jour`,
    };
    return map[a.type] ?? a.message ?? 'Événement reçu';
  }

  // Effacer les activités
  clearActivities(): void {
    this.statsService
      .clearActivities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.activities = [];
          this.actPage = 1;
        },
        error: (err: any) =>
          console.error('Erreur lors de la suppression des activités:', err),
      });
  }

  // Initialisation du WebSocket admin
  private initWebSocket(): void {
    const token = this.authService.getToken() ?? undefined;
    this.wsService.connect(token, 'EMPLOYEE');

    this.wsService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s: ConnectionStatus) => (this.wsStatus = s));

    this.wsService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        console.log('Stats mises à jour via WebSocket:', payload);
        this.applyStatsPayload(payload);
      });

    this.wsService.events$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      console.log('Événement admin reçu:', event);
      this.handleRealtimeEvent(event);
    });
  }

  // Initialisation du WebSocket recrutement
  private initRecrutementWebSocket(): void {
    if (!this.keycloakId) {
      console.warn(
        "keycloakId non défini, impossible d'initialiser le WebSocket recrutement",
      );
      return;
    }

    const token = this.authService.getToken() ?? undefined;
    this.recrutementWsService.connect(token, 'EMPLOYEE', this.keycloakId);

    this.recrutementWsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        console.log('Événement recrutement reçu:', event);
        this.handleRecrutementEvent(event);
      });
  }

  // Application des données statistiques
  private applyStatsPayload(data: StatsPayload): void {
    console.log('Application des données statistiques:', data);

    this.stats.totalUsers = data.users?.total ?? 0;
    this.stats.deltaUsers = data.users?.delta ?? 0;
    this.stats.totalRH = data.rh?.total ?? 0;
    this.stats.deltaRH = data.rh?.delta ?? 0;
    this.stats.totalEmployees = data.employees?.total ?? 0;
    this.stats.deltaEmployees = data.employees?.delta ?? 0;
    this.stats.totalCandidats = data.candidats?.total ?? 0;
    this.stats.deltaCandidats = data.candidats?.delta ?? 0;
    this.stats.totalInactifs = data.inactifs?.total ?? 0;
    this.stats.deltaInactifs = data.inactifs?.delta ?? 0;

    this.monthlyData = data.monthly ?? {};
    this.inscrCessData = data.inscrCess ?? { inscriptions: [], cessations: [] };

    console.log('Derniers 5 utilisateurs:', data.last5);
    this.mapRecentUsers(data.last5 ?? []);

    this.computeRoleDistribution(data);

    if (this.chartsReady) this.updateCharts();
    else this.pendingUpdate = () => this.updateCharts();
  }

  // Mappage des utilisateurs récents
  private mapRecentUsers(last5: any[]): void {
    if (!last5 || last5.length === 0) {
      console.warn('Aucun utilisateur récent reçu');
      this.recentUsers = [];
      return;
    }

    this.recentUsers = last5.map((u: any) => ({
      id: u.id ?? 0,
      cin: u.cin ?? 'N/A',
      matricule: u.matricule ?? 'N/A',
      nom: u.nom ?? 'Inconnu',
      prenom: u.prenom ?? 'Inconnu',
      email: u.email ?? 'N/A',
      role: u.role ?? 'N/A',
      etatCompte: u.etatCompte ?? 'ACTIF',
      dateInscrit: u.dateInscrit ?? new Date().toISOString(),
      image: u.image ?? null,
      imageLoading: false,
    }));
  }

  // Calcul de la répartition des rôles
  private computeRoleDistribution(data: StatsPayload): void {
    const grandTotal = (data.users?.total ?? 0) || 1;
    this.roleDistribution[0].pct = Math.round(
      ((data.rh?.total ?? 0) / grandTotal) * 100,
    );
    this.roleDistribution[1].pct = Math.round(
      ((data.employees?.total ?? 0) / grandTotal) * 100,
    );
    this.roleDistribution[2].pct = Math.round(
      ((data.candidats?.total ?? 0) / grandTotal) * 100,
    );
  }

  // Construction de la source de l'image
  buildImageSrc(image: string | null): string | null {
    if (!image) return null;
    return image.startsWith('data:')
      ? image
      : `data:image/jpeg;base64,${image}`;
  }

  // Récupération des initiales
  getInitials(user: RecentUser): string {
    const p = user.prenom?.charAt(0)?.toUpperCase() ?? '';
    const n = user.nom?.charAt(0)?.toUpperCase() ?? '';
    return `${p}${n}`;
  }

  // Récupération de la source de l'avatar
  getAvatarSrc(): string | null {
    const img = this.profile?.image;
    if (!img) return null;
    return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
  }

  // Récupération de la couleur du rôle
  getRoleColor(role: string): string {
    return DashboardEmployeeComponent.ROLE_COLORS[role] ?? '#9ca3af';
  }

  // Gestion des événements admin en temps réel
  private handleRealtimeEvent(event: AdminRealtimeEvent): void {
    console.log("Gestion de l'événement admin:", event);
    this.lastEvent = event;
    this.lastEventKind = 'admin';
    this.showEventToast();
    this.addActivityFromEvent(event);
    this.actPage = 1; // Réinitialiser la page
  }

  // Ajout d'une activité à partir d'un événement
  private addActivityFromEvent(event: AdminRealtimeEvent): void {
    const p = event.payload as any;

    const textMap: Record<string, string> = {
      NEW_USER: `Nouveau compte <strong>${p?.role ?? ''}</strong> : ${p?.prenom ?? ''} ${p?.nom ?? ''}`,
      CESSATION: `Compte suspendu : <strong>${p?.prenom ?? ''} ${p?.nom ?? ''}</strong>`,
      REACTIVATION: `Compte réactivé : <strong>${p?.prenom ?? ''} ${p?.nom ?? ''}</strong>`,
      LOGIN_ACTIVITY: `Connexion : <strong>${p?.prenom ?? ''} ${p?.nom ?? ''}</strong>`,
      CERTIFICATION: `Certification <strong>${p?.action ?? ''}</strong> — ${p?.titre ?? ''} (${p?.prenom ?? ''} ${p?.nom ?? ''})`,
      DEMANDE_CONGE: `Demande de congé : <strong>${p?.prenom ?? ''} ${p?.nom ?? ''}</strong>`,
      STATS_UPDATE: `Statistiques mises à jour`,
    };

    const text = textMap[event.type] ?? 'Événement reçu';
    const time = this.formatTime(event.timestamp);
    const color = eventColor(event.type);

    // Éviter les doublons pour STATS_UPDATE
    if (
      event.type === 'STATS_UPDATE' &&
      this.activities.length > 0 &&
      this.activities[0].text === text
    ) {
      this.activities[0].time = time; // Mettre à jour l'heure
      return;
    }

    this.activities.unshift({ text, time, color });
    if (this.activities.length > 20) {
      this.activities = this.activities.slice(0, 20);
    }
  }

  // Gestion des événements recrutement en temps réel
  private handleRecrutementEvent(event: RecrutementRealtimeEvent): void {
    console.log("Gestion de l'événement recrutement:", event);
    this.lastEvent = event;
    this.lastEventKind = 'recrutement';
    this.showEventToast();

    this.activities.unshift({
      text: buildRecrutementNotificationText(event),
      time: this.formatTime(event.timestamp),
      color: recrutementEventColor(event.type),
    });

    if (this.activities.length > 20) {
      this.activities = this.activities.slice(0, 20);
    }
    this.actPage = 1; // Réinitialiser la page
  }

  // Affichage du toast pour les événements
  private showEventToast(): void {
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.showToast = false), 4000);
  }

  // Formatage de l'heure
  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Récupération du label du statut WebSocket
  get wsStatusLabel(): string {
    return wsStatusLabel(this.wsStatus);
  }

  // Récupération de la classe du statut WebSocket
  get wsStatusClass(): string {
    return wsStatusClass(this.wsStatus);
  }

  // Récupération du titre du toast
  getToastTitle(): string {
    if (!this.lastEvent) return 'Mise à jour';
    if (this.lastEventKind === 'recrutement') {
      return buildRecrutementNotificationText(
        this.lastEvent as RecrutementRealtimeEvent,
      );
    }
    const type = (this.lastEvent as AdminRealtimeEvent).type;
    return DashboardEmployeeComponent.ADMIN_TOAST_TITLES[type] ?? 'Mise à jour';
  }

  // Récupération du sous-titre du toast
  getToastSub(): string {
    if (!this.lastEvent || this.lastEventKind === 'recrutement') return '';
    const p = (this.lastEvent as AdminRealtimeEvent).payload as any;
    if (!p?.prenom) return '';
    let sub = `${p.prenom} ${p.nom ?? ''}`.trim();
    if (p.role) sub += ` — ${p.role}`;
    if (p.titre) sub += ` — ${p.titre}`;
    return sub;
  }

  // Récupération de l'icône du toast
  getToastIcon(): string {
    if (!this.lastEvent) return 'fa-bell';
    return this.lastEventKind === 'recrutement'
      ? recrutementEventIcon((this.lastEvent as RecrutementRealtimeEvent).type)
      : eventIcon((this.lastEvent as AdminRealtimeEvent).type);
  }

  // Récupération de la couleur du toast
  getToastColor(): string {
    if (!this.lastEvent) return '#64748b';
    return this.lastEventKind === 'recrutement'
      ? recrutementEventColor((this.lastEvent as RecrutementRealtimeEvent).type)
      : eventColor((this.lastEvent as AdminRealtimeEvent).type);
  }

  // Fermeture du toast
  dismissToast(): void {
    this.showToast = false;
  }

  // Formatage du delta
  formatDelta(delta: number): string {
    return delta >= 0 ? `+${delta} ce mois` : `${delta} ce mois`;
  }

  // Vérification si le delta est positif
  isDeltaUp(d: number): boolean {
    return d >= 0;
  }

  // Vérification si le delta est négatif
  isDeltaDown(d: number): boolean {
    return d < 0;
  }

  // Navigation vers la page des utilisateurs
  goToUsersPage(): void {
    this.router.navigate(['/manager/listUsersManager']);
  }

  // Déconnexion
  logout(): void {
    this.authService.logout();
  }

  // Initialisation des graphiques
  private initCharts(): void {
    this.buildLineChart();
    this.buildDoughnutChart();
  }

  // Mise à jour des graphiques
  private updateCharts(): void {
    const now = new Date().getMonth();
    const slice = (arr: number[]) => (arr ?? []).slice(0, now + 1);

    const line = this.charts[0];
    if (line) {
      line.data.labels = DashboardEmployeeComponent.MONTH_LABELS.slice(
        0,
        now + 1,
      );
      line.data.datasets[0].data = slice(this.monthlyData['RH'] ?? []);
      line.data.datasets[1].data = slice(this.monthlyData['EMPLOYEE'] ?? []);
      line.data.datasets[2].data = slice(this.monthlyData['CANDIDAT'] ?? []);
      line.data.datasets[3].data = slice(this.inscrCessData.cessations ?? []);
      line.update('active');
    }

    const donut = this.charts[1];
    if (donut) {
      donut.data.datasets[0].data = [
        this.stats.totalRH,
        this.stats.totalEmployees,
        this.stats.totalCandidats,
      ];
      donut.update('active');
    }
  }

  // Construction du graphique en ligne
  private buildLineChart(): void {
    const ctx = this.lineChartRef?.nativeElement;
    if (!ctx) return;

    this.charts.push(
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'RH',
              data: [],
              borderColor: '#1D9E75',
              backgroundColor: 'rgba(29,158,117,0.07)',
              tension: 0.4,
              pointRadius: 4,
              fill: true,
            },
            {
              label: 'Employés',
              data: [],
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245,158,11,0.06)',
              tension: 0.4,
              pointRadius: 4,
              fill: true,
            },
            {
              label: 'Candidats',
              data: [],
              borderColor: '#4a6cf7',
              backgroundColor: 'rgba(74,108,247,0.07)',
              tension: 0.4,
              pointRadius: 4,
              fill: true,
            },
            {
              label: 'Cessations',
              data: [],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.06)',
              tension: 0.4,
              pointRadius: 4,
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
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: 'rgba(74,108,247,0.06)' },
              ticks: { color: '#94a3b8', font: { size: 11 } },
            },
            y: {
              grid: { color: 'rgba(74,108,247,0.06)' },
              ticks: { color: '#94a3b8', font: { size: 11 } },
            },
          },
        },
      }),
    );
  }

  // Construction du graphique en donut
  private buildDoughnutChart(): void {
    const ctx = this.doughnutChartRef?.nativeElement;
    if (!ctx) return;

    this.charts.push(
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['RH', 'Employés', 'Candidats'],
          datasets: [
            {
              data: [0, 0, 0],
              backgroundColor: ['#1D9E75', '#f59e0b', '#4a6cf7'],
              borderWidth: 3,
              borderColor: '#fff',
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          animation: { duration: 600 },
          plugins: { legend: { display: false } },
        },
      }),
    );
  }
}
