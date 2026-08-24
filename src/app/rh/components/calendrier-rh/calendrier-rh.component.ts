import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Interview } from '../../../core/models/interview';
import { InterviewService } from '../../../core/service/interview.service';
import { InterviewDetailDialogComponent } from '../interview-detail-dialog/interview-detail-dialog.component';
import { InterviewFormDialogComponent } from '../interview-form-dialog/interview-form-dialog.component';
import { PlanifierEntretienCandidatureDialogComponent } from '../planifier-entretien-candidature-dialog/planifier-entretien-candidature-dialog.component';
import type { PlanifierEntretienDialogResult } from '../planifier-entretien-candidature-dialog/planifier-entretien-candidature-dialog.component';
import {
  PlanificationCandidatureContext,
  RecrutementInterviewService,
} from '../../../core/service/recrutement-interview.service';
import { ReprogrammerService } from '../../../core/service/reporte-entretient.service'; // ajuste le chemin

interface ContexteReprogrammation {
  demandeId?: string;
  interviewId: string;
  candidateName?: string;
  returnUrl?: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

interface MiniDay {
  date: Date;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
}

interface AgendaGroup {
  iso: string;
  dayNumber: number;
  weekday: string;
  monthYear: string;
  isToday: boolean;
  items: Interview[];
}

@Component({
  selector: 'app-calendrier-rh',
  templateUrl: './calendrier-rh.component.html',
  styleUrl: './calendrier-rh.component.css',
})
export class CalendrierRHComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;

  private readonly destroy$ = new Subject<void>();

  private static readonly ROUTE_DETAIL_COMPLET =
    '/rh/ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTable';

  // ==================== Données ====================
  interviews: Interview[] = [];
  filteredInterviews: Interview[] = [];
  loading = false;

  // ==================== Vue / navigation ====================
  view: ViewMode = 'month';
  currentDate = new Date();
  periodLabel = '';
  miniWeeks: MiniDay[][] = [];

  // ==================== Filtres ====================
  searchTerm = '';
  statusFilter = '';
  typeFilter: string | null = null;
  recruteurFilter: string | null = null;
  filtreAujourdhui = false;
  private visibleStatuses = new Set<string>();

  // ==================== Pagination (onglet Table) ====================
  page = 1;
  pageSize = 8;

  // ==================== Pagination (onglet Calendrier -> vue Agenda) ====================
  agendaPage = 1;
  agendaPageSize = 5;

  // ==================== Contexte "planifier depuis une candidature" ====================
  pendingCandidatureContext: PlanificationCandidatureContext | null = null;

  // ==================== Contexte "reprogrammation" (nouveau) ====================
  modeReprogrammation = false;
  contexteReprogrammation: ContexteReprogrammation | null = null;

  // ==================== Référentiels d'affichage ====================
  readonly statuses = [
    'PLANIFIE',
    'CONFIRME',
    'EN_COURS',
    'TERMINE',
    'ANNULE',
    'REPORTE',
    'ABSENT',
  ];

  readonly statusLabels: Record<string, string> = {
    PLANIFIE: 'Planifié',
    CONFIRME: 'Confirmé',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
    REPORTE: 'Reporté',
    ABSENT: 'Absent',
  };

  readonly statusColors: Record<string, string> = {
    PLANIFIE: '#f59e0b',
    CONFIRME: '#10b981',
    EN_COURS: '#3b82f6',
    TERMINE: '#334155',
    ANNULE: '#ef4444',
    REPORTE: '#8b5cf6',
    ABSENT: '#f43f5e',
  };

  private readonly statusIcons: Record<string, string> = {
    PLANIFIE: 'fa-hourglass-half',
    CONFIRME: 'fa-check',
    EN_COURS: 'fa-spinner',
    TERMINE: 'fa-flag-checkered',
    ANNULE: 'fa-ban',
    REPORTE: 'fa-rotate',
    ABSENT: 'fa-user-slash',
  };

  readonly interviewTypes = [
    { value: 'RH_INITIAL', label: 'RH Initial' },
    { value: 'RH_FINAL', label: 'RH Final' },
    { value: 'TECHNIQUE', label: 'Technique' },
    { value: 'LIBRE', label: 'Entretien libre' },
  ];

  readonly typeLabels: Record<string, string> = {
    RH_INITIAL: 'RH Initial',
    RH_FINAL: 'RH Final',
    TECHNIQUE: 'Technique',
    LIBRE: 'Entretien libre',
  };

  readonly typeColors: Record<string, string> = {
    RH_INITIAL: '#3b82f6',
    RH_FINAL: '#8b5cf6',
    TECHNIQUE: '#f97316',
    LIBRE: '#64748b',
  };

  // ==================== FullCalendar ====================
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: false,
    height: 'auto',
    selectable: true,
    dayMaxEvents: 3,
    events: [],
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    dateClick: (arg: DateClickArg) => this.onDateClick(arg.dateStr),
    dayCellClassNames: (arg) =>
      arg.date.getDay() === 0 || arg.date.getDay() === 6
        ? ['fc-day-weekend-tn']
        : [],
  };

  chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' as const } },
  };

  constructor(
    private reprogrammerService: ReprogrammerService,
    private route: ActivatedRoute,
    public interviewService: InterviewService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private recrutementInterviewService: RecrutementInterviewService,
  ) {
    this.statuses.forEach((s) => this.visibleStatuses.add(s));
  }

  ngOnInit(): void {
    this.recupererContexteReprogrammation();
    this.recupererContexteCandidature();
    this.recomputeCalendarView();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Contexte candidature ====================

  private recupererContexteCandidature(): void {
    const navigationState = this.router.getCurrentNavigation()?.extras?.state;
    const state = navigationState ?? history.state;
    const ctx = state?.['planifierEntretien'] as
      | PlanificationCandidatureContext
      | undefined;

    if (ctx) {
      this.pendingCandidatureContext = ctx;
    }
  }

  annulerPlanificationCandidature(): void {
    this.pendingCandidatureContext = null;
  }

  // ==================== Contexte reprogrammation ====================

  private recupererContexteReprogrammation(): void {
    const params = this.route.snapshot.queryParams;
    if (params['modeReprogrammation'] !== '1') return;

    const brut = sessionStorage.getItem('reprogrammation_contexte');
    const stocke: ContexteReprogrammation | null = brut
      ? JSON.parse(brut)
      : null;

    this.modeReprogrammation = true;
    this.contexteReprogrammation = {
      demandeId: params['demandeId'] ?? stocke?.demandeId,
      interviewId: params['interviewId'] ?? stocke?.interviewId,
      candidateName: stocke?.candidateName,
      returnUrl: stocke?.returnUrl,
    };
  }

  annulerModeReprogrammation(): void {
    sessionStorage.removeItem('reprogrammation_contexte');
    this.modeReprogrammation = false;
    this.contexteReprogrammation = null;
  }

  private terminerModeReprogrammation(): void {
    const returnUrl =
      this.contexteReprogrammation?.returnUrl ?? '/rh/demandes-reprogrammation';
    sessionStorage.removeItem('reprogrammation_contexte');
    this.modeReprogrammation = false;
    this.contexteReprogrammation = null;
    this.router.navigate([returnUrl], {
      queryParams: { propositionEnvoyee: 1 },
    });
  }

  private ouvrirPropositionReprogrammation(dateStr: string): void {
    const interviewId = this.contexteReprogrammation?.interviewId;
    if (!interviewId) return;

    const dateAffichee = new Date(dateStr + 'T00:00:00').toLocaleDateString(
      'fr-FR',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );

    Swal.fire({
      title: 'Proposer un nouveau créneau',
      html: `
        <p style="margin-bottom:12px;color:#64748b;text-align:left;">
          Date sélectionnée : <strong>${dateAffichee}</strong><br>
          Candidat : <strong>${this.contexteReprogrammation?.candidateName ?? '—'}</strong>
        </p>
        <input id="swal-heure" type="time" class="swal2-input" placeholder="Heure">
        <textarea id="swal-motif" class="swal2-textarea" placeholder="Motif de la nouvelle proposition"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Envoyer la proposition',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const heure = (
          document.getElementById('swal-heure') as HTMLInputElement
        )?.value;
        const motif = (
          document.getElementById('swal-motif') as HTMLTextAreaElement
        )?.value?.trim();
        if (!heure) {
          Swal.showValidationMessage('Veuillez choisir une heure');
          return;
        }
        if (!motif) {
          Swal.showValidationMessage('Veuillez indiquer un motif');
          return;
        }
        return { heure, motif };
      },
    }).then((res) => {
      if (!res.isConfirmed || !res.value) return;

      const nouvelleDateProposee = `${dateStr}T${res.value.heure}:00`;

      this.reprogrammerService
        .proposerParIntervenant(interviewId, {
          nouvelleDateProposee,
          motif: res.value.motif,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Nouvelle date proposée avec succès', 'Fermer', {
              duration: 3000,
            });
            this.terminerModeReprogrammation();
          },
          error: (err) =>
            Swal.fire(
              'Erreur',
              err?.message ?? "Impossible d'envoyer la proposition",
              'error',
            ),
        });
    });
  }

  // ==================== FILTRAGE RH SPÉCIFIQUE ====================

  private isRhOrLibre(interview: Interview): boolean {
    const t = interview.type;
    return !t || t === 'RH_INITIAL' || t === 'RH_FINAL';
  }

  get rhFilteredInterviews(): Interview[] {
    return this.filteredInterviews.filter((i) => this.isRhOrLibre(i));
  }

  get visibleRhInterviews(): Interview[] {
    return this.visibleInterviews.filter((i) => this.isRhOrLibre(i));
  }

  get rhAgendaGroups(): AgendaGroup[] {
    return this.agendaGroups
      .map((groupe) => ({
        ...groupe,
        items: groupe.items.filter((i) => this.isRhOrLibre(i)),
      }))
      .filter((groupe) => groupe.items.length > 0);
  }

  get rhTableInterviews(): Interview[] {
    return this.rhFilteredInterviews;
  }

  // ==================== Chargement ====================

  refresh(): void {
    this.loading = true;
    this.interviewService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.interviews = data;
          this.loading = false;
          this.applyFilters();
          this.buildMiniCalendar();
        },
        error: (err) => {
          this.loading = false;
          Swal.fire(
            'Erreur',
            err?.message ?? 'Impossible de charger les entretiens',
            'error',
          );
        },
      });
  }

  // ==================== Filtres ====================

  private matchesEverythingExceptStatus(i: Interview): boolean {
    if (this.filtreAujourdhui && !this.isToday(i.interviewDate)) return false;
    if (this.typeFilter && (i.type || 'LIBRE') !== this.typeFilter)
      return false;
    if (this.recruteurFilter && i.interviewerName !== this.recruteurFilter)
      return false;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      const haystack =
        `${i.candidateName ?? ''} ${i.posteRecrutement ?? ''}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }

  applyFilters(): void {
    this.filteredInterviews = this.interviews.filter(
      (i) =>
        this.matchesEverythingExceptStatus(i) && this.isStatusVisible(i.status),
    );
    this.page = 1;
    this.agendaPage = 1;
    this.syncCalendarEvents();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  isStatusVisible(status: string): boolean {
    return this.visibleStatuses.has(status);
  }

  toggleStatus(status: string): void {
    if (this.visibleStatuses.has(status)) this.visibleStatuses.delete(status);
    else this.visibleStatuses.add(status);
    this.applyFilters();
  }

  setTypeFilter(value: string | null): void {
    this.typeFilter = value;
    this.applyFilters();
  }

  setRecruteurFilter(value: string | null): void {
    this.recruteurFilter = value;
    this.applyFilters();
  }

  toggleFiltreAujourdhui(): void {
    this.filtreAujourdhui = !this.filtreAujourdhui;
    this.applyFilters();
  }

  applyFiltersFromTableSelect(): void {
    if (this.statusFilter) {
      this.statuses.forEach((s) =>
        s === this.statusFilter
          ? this.visibleStatuses.add(s)
          : this.visibleStatuses.delete(s),
      );
    } else {
      this.statuses.forEach((s) => this.visibleStatuses.add(s));
    }
    this.applyFilters();
  }

  get statusCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const s of this.statuses) counts[s] = 0;
    for (const i of this.interviews) {
      if (this.matchesEverythingExceptStatus(i))
        counts[i.status] = (counts[i.status] || 0) + 1;
    }
    return counts;
  }

  get recruteursDisponibles(): string[] {
    return [
      ...new Set(this.interviews.map((i) => i.interviewerName).filter(Boolean)),
    ].sort();
  }

  // ==================== KPI & Statistiques ====================

  get kpiTotal(): number {
    return this.rhFilteredInterviews.length;
  }

  get kpiConfirmes(): number {
    return this.rhFilteredInterviews.filter((i) => i.status === 'CONFIRME')
      .length;
  }

  get kpiEnAttente(): number {
    return this.rhFilteredInterviews.filter((i) => i.status === 'PLANIFIE')
      .length;
  }

  get kpiAujourdhui(): number {
    return this.rhFilteredInterviews.filter(
      (i) =>
        this.isToday(i.interviewDate) &&
        i.status !== 'ANNULE' &&
        i.status !== 'TERMINE',
    ).length;
  }

  get kpiAReprogrammer(): number {
    return this.rhFilteredInterviews.filter((i) => i.status === 'REPORTE')
      .length;
  }

  get statsFiltrees(): { status: string; count: number }[] {
    const counts = new Map<string, number>();
    this.statuses.forEach((s) => counts.set(s, 0));
    this.rhFilteredInterviews.forEach((i) =>
      counts.set(i.status, (counts.get(i.status) || 0) + 1),
    );
    return [...counts.entries()].map(([status, count]) => ({ status, count }));
  }

  get barChartData() {
    const data = this.statsFiltrees;
    return {
      labels: data.map((d) => this.statusLabels[d.status] || d.status),
      datasets: [
        {
          data: data.map((d) => d.count),
          backgroundColor: data.map(
            (d) => this.statusColors[d.status] || '#94a3b8',
          ),
        },
      ],
    };
  }

  private isToday(dateIso?: string): boolean {
    if (!dateIso) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateIso + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }

  // ==================== Navigation calendrier ====================

  get visibleInterviews(): Interview[] {
    const { start, end } = this.currentPeriodRange();
    return this.filteredInterviews.filter((i) => {
      if (!i.interviewDate) return false;
      const d = new Date(i.interviewDate + 'T00:00:00');
      return d >= start && d < end;
    });
  }

  private currentPeriodRange(): { start: Date; end: Date } {
    const d = new Date(this.currentDate);
    if (this.view === 'day') {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    if (this.view === 'week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return { start, end };
  }

  private updatePeriodLabel(): void {
    const { start, end } = this.currentPeriodRange();
    if (this.view === 'day') {
      this.periodLabel = this.currentDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (this.view === 'week') {
      const last = new Date(end);
      last.setDate(last.getDate() - 1);
      this.periodLabel = `${start.getDate()} - ${last.getDate()} ${last.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      this.periodLabel = this.currentDate.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
    }
  }

  prevMonth(): void {
    this.step(-1);
  }

  nextMonth(): void {
    this.step(1);
  }

  private step(direction: 1 | -1): void {
    const d = new Date(this.currentDate);
    if (this.view === 'day') d.setDate(d.getDate() + direction);
    else if (this.view === 'week') d.setDate(d.getDate() + 7 * direction);
    else d.setMonth(d.getMonth() + direction);
    this.currentDate = d;
    this.calendarComponent?.getApi()?.gotoDate(this.currentDate);
    this.recomputeCalendarView();
  }

  goToday(): void {
    this.currentDate = new Date();
    this.calendarComponent?.getApi()?.today();
    this.recomputeCalendarView();
  }

  setView(v: ViewMode): void {
    this.view = v;
    const fcView: Record<ViewMode, string> = {
      day: 'timeGridDay',
      week: 'timeGridWeek',
      month: 'dayGridMonth',
      agenda: 'dayGridMonth',
    };
    this.calendarComponent?.getApi()?.changeView(fcView[v]);
    if (v !== 'agenda')
      this.calendarComponent?.getApi()?.gotoDate(this.currentDate);
    this.recomputeCalendarView();
  }

  private recomputeCalendarView(): void {
    this.updatePeriodLabel();
    this.buildMiniCalendar();
  }

  selectMiniDay(jour: MiniDay): void {
    this.currentDate = jour.date;
    this.recomputeCalendarView();
    if (this.view === 'agenda') {
      const iso = this.toIso(jour.date);
      const index = this.rhAgendaGroups.findIndex((g) => g.iso === iso);
      if (index >= 0) {
        this.agendaPage = Math.floor(index / this.agendaPageSize) + 1;
      }
      setTimeout(
        () =>
          document
            .getElementById(`jour-${iso}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        0,
      );
    } else {
      this.calendarComponent?.getApi()?.gotoDate(jour.date);
    }
  }

  private toIso(d: Date): string {
    const p = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  private buildMiniCalendar(): void {
    const ref = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1,
    );
    const firstWeekday = ref.getDay();
    const gridStart = new Date(ref);
    gridStart.setDate(gridStart.getDate() - firstWeekday);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDates = new Set(
      this.rhFilteredInterviews
        .map((i) => i.interviewDate)
        .filter(Boolean) as string[],
    );

    const weeks: MiniDay[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const week: MiniDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        week.push({
          date,
          day: date.getDate(),
          inMonth: date.getMonth() === this.currentDate.getMonth(),
          isToday: date.getTime() === today.getTime(),
          isSelected: this.toIso(date) === this.toIso(this.currentDate),
          hasEvents: eventDates.has(this.toIso(date)),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    this.miniWeeks = weeks;
  }

  // ==================== Vue Agenda ====================

  get agendaGroups(): AgendaGroup[] {
    const byDay = new Map<string, Interview[]>();
    const sorted = [...this.filteredInterviews]
      .filter((i) => !!i.interviewDate)
      .sort((a, b) =>
        `${a.interviewDate}${a.startTime}`.localeCompare(
          `${b.interviewDate}${b.startTime}`,
        ),
      );

    for (const i of sorted) {
      const key = i.interviewDate!;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(i);
    }

    const today = this.toIso(new Date());
    return [...byDay.entries()].map(([iso, items]) => {
      const d = new Date(iso + 'T00:00:00');
      return {
        iso,
        dayNumber: d.getDate(),
        weekday: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
        monthYear: d.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
        isToday: iso === today,
        items,
      };
    });
  }

  get pagedAgendaGroups(): AgendaGroup[] {
    const start = (this.agendaPage - 1) * this.agendaPageSize;
    return this.rhAgendaGroups.slice(start, start + this.agendaPageSize);
  }

  get agendaTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.rhAgendaGroups.length / this.agendaPageSize),
    );
  }

  goToAgendaPage(p: number): void {
    this.agendaPage = Math.min(Math.max(1, p), this.agendaTotalPages);
  }

  prevAgendaPage(): void {
    this.goToAgendaPage(this.agendaPage - 1);
  }

  nextAgendaPage(): void {
    this.goToAgendaPage(this.agendaPage + 1);
  }

  // ==================== Helpers d'affichage — Vue Agenda ====================

  statusIcon(status: string): string {
    return this.statusIcons[status] || 'fa-circle';
  }

  modeIcon(mode?: string): string {
    switch (mode) {
      case 'DISTANCIEL':
        return 'fa-laptop';
      case 'TELEPHONIQUE':
        return 'fa-phone';
      case 'PRESENTIEL':
        return 'fa-building';
      default:
        return 'fa-circle-question';
    }
  }

  modeLabel(interview: Interview): string {
    switch (interview.mode) {
      case 'DISTANCIEL':
        return 'En ligne';
      case 'TELEPHONIQUE':
        return 'Téléphonique';
      case 'PRESENTIEL':
        return interview.location || 'Présentiel';
      default:
        return interview.mode || '—';
    }
  }

  timeRange(interview: Interview): string {
    if (!interview.startTime) return '—';
    if (!interview.endTime) return interview.startTime;
    return `${interview.startTime} → ${interview.endTime}`;
  }

  voirDetailComplet(interview: Interview): void {
    if (!interview.id) return;
    this.router.navigate([
      CalendrierRHComponent.ROUTE_DETAIL_COMPLET,
      interview.id,
    ]);
  }

  planifierSuite(i: Interview): void {
    const ref = this.dialog.open(InterviewFormDialogComponent, {
      width: '800px',
      data: {
        interview: null,
        allInterviews: this.interviews,
        prefill: {
          candidateName: i.candidateName,
          candidateEmail: i.candidateEmail,
          posteRecrutement: i.posteRecrutement,
        },
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.refresh();
    });
  }

  // ==================== FullCalendar : synchronisation des events ====================

  private syncCalendarEvents(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.visibleRhInterviews
        .filter((i) => i.interviewDate && i.startTime)
        .map((i) => ({
          id: i.id,
          title: `${i.candidateName} · ${this.typeLabels[i.type || 'LIBRE']}`,
          start: `${i.interviewDate}T${i.startTime}`,
          end: `${i.interviewDate}T${i.endTime}`,
          backgroundColor: this.statusColors[i.status] || '#94a3b8',
          borderColor: this.statusColors[i.status] || '#94a3b8',
          extendedProps: { interview: i },
        })),
    };
  }

  private onEventClick(arg: EventClickArg): void {
    const interview = arg.event.extendedProps['interview'] as Interview;
    this.openDetail(interview);
  }

  /** ✅ Version unique de onDateClick — priorité : reprogrammation > candidature > création libre. */
  private onDateClick(dateStr: string): void {
    if (this.modeReprogrammation) {
      this.ouvrirPropositionReprogrammation(dateStr);
      return;
    }
    if (this.pendingCandidatureContext) {
      this.openPlanifierCandidatureDialog(dateStr);
      return;
    }
    this.openCreateDialog(dateStr);
  }

  // ==================== Actions CRUD / dialogs ====================

  openCreateDialog(selectedDate?: string): void {
    if (this.pendingCandidatureContext) {
      this.openPlanifierCandidatureDialog(selectedDate);
      return;
    }

    const ref = this.dialog.open(InterviewFormDialogComponent, {
      width: '800px',
      data: { interview: null, allInterviews: this.interviews, selectedDate },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.refresh();
    });
  }

  private openPlanifierCandidatureDialog(selectedDate?: string): void {
    const context = this.pendingCandidatureContext;
    if (!context) return;

    const ref = this.dialog.open(PlanifierEntretienCandidatureDialogComponent, {
      width: '560px',
      data: { context, selectedDate },
    });

    ref
      .afterClosed()
      .subscribe((result: PlanifierEntretienDialogResult | undefined) => {
        if (!result) return;

        this.recrutementInterviewService
          .planifier(context.applicationId, result.type, result.payload)
          .subscribe({
            next: () => {
              this.snackBar.open('Entretien planifié avec succès', 'Fermer', {
                duration: 3000,
              });
              this.pendingCandidatureContext = null;
              this.refresh();
            },
            error: (err) =>
              Swal.fire(
                'Erreur',
                err?.message ?? "Impossible de planifier l'entretien",
                'error',
              ),
          });
      });
  }

  editInterview(i: Interview): void {
    const ref = this.dialog.open(InterviewFormDialogComponent, {
      width: '800px',
      data: { interview: i, allInterviews: this.interviews },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.refresh();
    });
  }

  openDetail(i: Interview, forceMode?: 'reporter'): void {
    const ref = this.dialog.open(InterviewDetailDialogComponent, {
      width: '520px',
      data: {
        interview: i,
        allInterviews: this.interviews,
        openReporterDirect: forceMode === 'reporter',
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.refresh();
    });
  }

  annulerRapide(i: Interview): void {
    Swal.fire({
      title: "Annuler l'entretien ?",
      input: 'text',
      inputLabel: 'Motif (optionnel)',
      showCancelButton: true,
      confirmButtonText: "Annuler l'entretien",
      cancelButtonText: 'Retour',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.interviewService
        .annulerEntretien(i.id!, res.value || undefined)
        .subscribe({
          next: () => {
            this.snackBar.open('Entretien annulé', 'Fermer', {
              duration: 3000,
            });
            this.refresh();
          },
          error: (err) => Swal.fire('Erreur', err.message, 'error'),
        });
    });
  }

  deleteInterview(i: Interview): void {
    if (!this.interviewService.canDelete(i)) return;
    Swal.fire({
      title: 'Supprimer définitivement ?',
      text: 'Cette action ne peut pas être annulée.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      confirmButtonColor: '#ef4444',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.interviewService.delete(i.id!).subscribe({
        next: () => {
          this.snackBar.open('Entretien supprimé', 'Fermer', {
            duration: 3000,
          });
          this.refresh();
        },
        error: (err) => Swal.fire('Erreur', err.message, 'error'),
      });
    });
  }
}
