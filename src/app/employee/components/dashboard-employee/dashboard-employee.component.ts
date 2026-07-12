// dashboard-employee.component.ts
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
import { StatsService } from '../../../core/service/stats.service';
import { UserProfileResponse } from '../../../core/models/UserProfileResponse';
import { UserCommonProfile } from '../../../core/models/userConneccted';

Chart.register(...registerables);

interface ActivityItem {
  type: string;
  message: string;
  role: string | null;
  actorPrenom: string | null;
  actorNom: string | null;
  motif: string | null;
  createdAt: string;
}

interface RecentUser {
  id: number;
  matricule: string;
  cin: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  etatCompte: string;
  dateInscrit: string;
  image: string | null;
  imageLoading: boolean;
}

interface RoleDistribution {
  label: string;
  role: string;
  pct: number;
  color: string;
}

interface ActivityDisplay {
  text: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-employee',
  templateUrl: './dashboard-employee.component.html',
  styleUrl: './dashboard-employee.component.css',
})
export class DashboardEmployeeComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  private static readonly ROLE_COLORS: Readonly<Record<string, string>> = {
    RH: '#1D9E75',
    EMPLOYEE: '#f59e0b',
    CANDIDAT: '#4a6cf7',
  };

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

  private charts: Chart[] = [];
  private chartsReady = false;
  private pendingUpdate: (() => void) | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  wsStatus: ConnectionStatus = 'DISCONNECTED';
  lastEvent: AdminRealtimeEvent | null = null;
  showToast = false;

  isLoading = false;
  isLoadingActivities = false;

  today = new Date();
  profile: UserProfileResponse | null = null;

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

  recentUsers: RecentUser[] = [];

  roleDistribution: RoleDistribution[] = [
    { label: 'RH', role: 'RH', pct: 0, color: '#1D9E75' },
    { label: 'Employés', role: 'EMPLOYEE', pct: 0, color: '#f59e0b' },
    { label: 'Candidats', role: 'CANDIDAT', pct: 0, color: '#4a6cf7' },
  ];

  activities: ActivityDisplay[] = [];

  private monthlyData: Record<string, number[]> = {};
  private inscrCessData = {
    inscriptions: [] as number[],
    cessations: [] as number[],
  };

  actPage = 1;
  actPageSize = 5;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly statsService: StatsService,
    private readonly wsService: WebSocketService,
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
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

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

  loadProfile(): void {
    this.userService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => (this.profile = this.mapToProfileResponse(p)),
        error: () => (this.profile = null),
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
          this.applyStatsPayload(data as unknown as StatsPayload);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur chargement stats :', err);
          this.isLoading = false;
        },
      });
  }

  loadActivities(): void {
    this.isLoadingActivities = true;

    this.statsService
      .getActivities(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ActivityItem[]) => {
          this.activities = data.map((a) => ({
            text: this.buildActivityText(a),
            time: this.formatTime(a.createdAt),
            color: eventColor(a.type),
          }));
          this.actPage = 1;
          this.isLoadingActivities = false;
        },
        error: () => {
          this.activities = [];
          this.actPage = 1;
          this.isLoadingActivities = false;
        },
      });
  }

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

  clearActivities(): void {
    this.statsService
      .clearActivities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.activities = [];
          this.actPage = 1;
        },
        error: (err: any) => console.error('Erreur clear activités :', err),
      });
  }

  private initWebSocket(): void {
    const token = this.authService.getToken() ?? undefined;
    this.wsService.connect(token);

    this.wsService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s: ConnectionStatus) => (this.wsStatus = s));
    this.wsService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => this.applyStatsPayload(payload));
    this.wsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleRealtimeEvent(event));
  }
  private applyStatsPayload(data: StatsPayload): void {
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

    this.mapRecentUsers(data.last5 ?? []);
    // this.loadRecentUsersImages(); ← supprimé, plus nécessaire
    this.computeRoleDistribution(data);

    if (this.chartsReady) this.updateCharts();
    else this.pendingUpdate = () => this.updateCharts();
  }
  /*
  private applyStatsPayload(data: StatsPayload): void {
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

    this.mapRecentUsers(data.last5 ?? []);
    this.loadRecentUsersImages();
    this.computeRoleDistribution(data);

    if (this.chartsReady) this.updateCharts();
    else this.pendingUpdate = () => this.updateCharts();
  }*/
  private mapRecentUsers(last5: any[]): void {
    this.recentUsers = last5.map((u: any) => ({
      id: u.id,
      cin: u.cin,
      matricule: u.matricule,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: u.role,
      etatCompte: u.etatCompte,
      dateInscrit: u.dateInscrit,
      image: u.image ?? null,
      imageLoading: false,
    }));
  }
  /*
  private mapRecentUsers(last5: any[]): void {
    this.recentUsers = last5.map((u: any) => ({
      id: u.id,
      cin: u.cin,
      matricule: u.matricule,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: u.role,
      etatCompte: u.etatCompte,
      dateInscrit: u.dateInscrit,
      image: null,
      imageLoading: true,
    }));
  }*/

  private computeRoleDistribution(data: StatsPayload): void {
    const grand = (data.users?.total ?? 0) || 1;
    this.roleDistribution[0].pct = Math.round(
      ((data.rh?.total ?? 0) / grand) * 100,
    );
    this.roleDistribution[1].pct = Math.round(
      ((data.employees?.total ?? 0) / grand) * 100,
    );
    this.roleDistribution[2].pct = Math.round(
      ((data.candidats?.total ?? 0) / grand) * 100,
    );
  }

  private loadRecentUsersImages(): void {
    this.recentUsers.forEach((user, index) => {
      if (!user.id) {
        this.recentUsers[index].imageLoading = false;
        return;
      }

      this.userService
        .getUserById(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (detail: any) => {
            this.recentUsers[index].image = detail.image ?? null;
            this.recentUsers[index].imageLoading = false;
          },
          error: () => {
            console.log(
              ' error Image loaded for user',
              user.id,
              this.recentUsers[index].image,
            );

            this.recentUsers[index].image = null;
            this.recentUsers[index].imageLoading = false;
          },
        });
    });
  }

  buildImageSrc(image: string | null): string | null {
    if (!image) return null;
    return image.startsWith('data:')
      ? image
      : `data:image/jpeg;base64,${image}`;
  }

  getInitials(user: RecentUser): string {
    const p = user.prenom?.charAt(0)?.toUpperCase() ?? '';
    const n = user.nom?.charAt(0)?.toUpperCase() ?? '';
    return `${p}${n}`;
  }

  getAvatarSrc(): string | null {
    const img = this.profile?.image;
    if (!img) return null;
    return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
  }

  getRoleColor(role: string): string {
    return DashboardEmployeeComponent.ROLE_COLORS[role] ?? '#9ca3af';
  }

  private handleRealtimeEvent(event: AdminRealtimeEvent): void {
    this.lastEvent = event;
    this.showEventToast();
    this.addActivityFromEvent(event);
  }

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

    if (
      event.type === 'STATS_UPDATE' &&
      this.activities.length > 0 &&
      this.activities[0].text === 'Statistiques mises à jour'
    ) {
      this.activities[0].time = this.formatTime(event.timestamp);
      return;
    }

    this.activities.unshift({
      text: textMap[event.type] ?? 'Événement reçu',
      time: this.formatTime(event.timestamp),
      color: eventColor(event.type),
    });

    if (this.activities.length > 20)
      this.activities = this.activities.slice(0, 20);
  }

  private showEventToast(): void {
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.showToast = false), 4000);
  }

  private formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get wsStatusLabel(): string {
    return wsStatusLabel(this.wsStatus);
  }

  get wsStatusClass(): string {
    return wsStatusClass(this.wsStatus);
  }

  getToastIcon(): string {
    return eventIcon(this.lastEvent?.type);
  }

  getToastColor(): string {
    return eventColor(this.lastEvent?.type);
  }

  dismissToast(): void {
    this.showToast = false;
  }

  formatDelta(delta: number): string {
    return delta >= 0 ? `+${delta} ce mois` : `${delta} ce mois`;
  }

  isDeltaUp(d: number): boolean {
    return d >= 0;
  }

  isDeltaDown(d: number): boolean {
    return d < 0;
  }

  goToUsersPage(): void {
    this.router.navigate(['/manager/listUsersManager']);
  }

  logout(): void {
    this.authService.logout();
  }

  private initCharts(): void {
    this.buildLineChart();
    this.buildDoughnutChart();
  }

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
