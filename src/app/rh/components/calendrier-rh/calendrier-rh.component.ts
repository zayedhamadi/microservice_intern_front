import { Component, OnInit, ViewChild } from '@angular/core';
import {  Location } from '@angular/common';

import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  FullCalendarModule,
  FullCalendarComponent,
} from '@fullcalendar/angular';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { forkJoin } from 'rxjs';
import {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
  DayCellContentArg,
  DayCellMountArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { NgxPaginationModule } from 'ngx-pagination';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import Swal from 'sweetalert2';
import { debounceTime, Subject } from 'rxjs';
import {
  Interview,
  InterviewDialogData,
} from '../../../core/models/interview';
import { InterviewService } from '../../../core/service/interview.service';
import { InterviewFormDialogComponent } from '../interview-form-dialog/interview-form-dialog.component';


import {
  STATUS_COLORS,
  AgendaGroup,
  MiniDay,
  STATUS_LABELS,
  HolidayInfo,
  TUNISIA_HOLIDAYS_2026,
  RAMADAN_2026,
} from '../../../core/constant/selectPoste';
import {
  PlanificationCandidatureContext,
  RecrutementInterviewService,
} from '../../../core/service/recrutement-interview.service';
import {
  PlanifierEntretienCandidatureDialogComponent,
  PlanifierEntretienDialogResult,
} from '../planifier-entretien-candidature-dialog/planifier-entretien-candidature-dialog.component';
import { InterviewStatus } from '../../../core/models/enums/enumPosteRecrutemnt';

const BUSY_DAY_THRESHOLD = 3;

@Component({
  selector: 'app-calendrier-rh',
  templateUrl: './calendrier-rh.component.html',
  styleUrl: './calendrier-rh.component.css',
})
  
export class CalendrierRHComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  interviews: Interview[] = [];
  filteredInterviews: Interview[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';
  page = 1;
  pageSize = 8;
  statuses = Object.values(InterviewStatus);
  statusColors = STATUS_COLORS;
  statusLabels = STATUS_LABELS;
  statusCounts: Record<string, number> = {};
  view: 'agenda' | 'day' | 'week' | 'month' = 'agenda';
  miniCalendarDate = new Date();
  miniWeeks: MiniDay[][] = [];
  selectedIso = this.toLocalIso(new Date());
  selectedStatuses = new Set<string>(this.statuses);
  private searchSubject = new Subject<string>();
  private holidayMap = new Map<string, HolidayInfo>();
  eventCountByDate: Record<string, number> = {};

  pendingPlanification: PlanificationCandidatureContext | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      multiMonthPlugin,
      interactionPlugin,
    ],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: false,
    height: 'auto',
    selectable: true,
    editable: false,
    dayMaxEvents: 3,
    events: [],
    select: (arg: DateSelectArg) => this.onDateSelect(arg),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    dayCellClassNames: (arg: DayCellContentArg) =>
      this.getDayCellClasses(arg.date),
    dayCellDidMount: (arg: DayCellMountArg) => this.onDayCellMount(arg),
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Liste',
    },
  };

  barChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  constructor(
    private readonly interviewService: InterviewService,
    private readonly recrutementInterviewService: RecrutementInterviewService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly location: Location,
  ) {
    this.searchSubject.pipe(debounceTime(350)).subscribe({
      next: () => {
        this.applyFilters();
        this.refreshCalendarEvents();
      },
      error: (error: any) => console.log(error),
    });
    TUNISIA_HOLIDAYS_2026.forEach((h) => this.holidayMap.set(h.date, h));
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state ?? window.history.state;
    this.pendingPlanification = navigationState?.['planifierEntretien'] ?? null;
  }

  ngOnInit(): void {
    this.buildMiniCalendar();
    this.loadInterviews();

    if (this.pendingPlanification) {
      this.location.replaceState(this.router.url, '', {});
      this.setView('month');
      Swal.fire({
        icon: 'info',
        title: 'Choisissez une date',
        text: `Cliquez sur une date dans le calendrier pour planifier l'entretien de ${this.pendingPlanification.candidateName}.`,
        timer: 3500,
        showConfirmButton: false,
      });
    }
  }

  private ouvrirPlanificationCandidature(
    context: PlanificationCandidatureContext,
    selectedDate?: string,
  ): void {
    const ref = this.dialog.open(PlanifierEntretienCandidatureDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
      data: { context, selectedDate },
    });
    ref
      .afterClosed()
      .subscribe((resultat: PlanifierEntretienDialogResult | undefined) => {
        if (!resultat) return;
        this.recrutementInterviewService
          .planifier(context.applicationId, resultat.type, resultat.payload)
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Entretien planifié',
                text: `Convocation envoyée à ${context.candidateEmail}.`,
                timer: 2200,
                showConfirmButton: false,
              });
              this.loadInterviews();
            },
            error: (err: any) => {
              console.log(err);
              Swal.fire(
                'Erreur',
                err?.error?.message ?? "Impossible de planifier l'entretien.",
                'error',
              );
            },
          });
      });
  }

  loadInterviews(): void {
    this.loading = true;

    forkJoin({
      libres: this.interviewService.getAll(),
      recrutement: this.recrutementInterviewService.getAll(),
    }).subscribe({
      next: ({ libres, recrutement }) => {
        const toutesLesInterviews: Interview[] = [
          ...(libres ?? []),
          ...(recrutement ?? []),
        ];

        // Suppression des doublons
        this.interviews = this.deduplicateInterviews(toutesLesInterviews);

        this.applyFilters();
        this.computeEventCountByDate();
        this.refreshCalendarEvents();
        this.computeStats();
        this.buildMiniCalendar();

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de charger les entretiens.', 'error');
      },
    });
  }
  private deduplicateInterviews(items: Interview[]): Interview[] {
    const uniqueInterviews: Interview[] = [];
    const indexes = new Map<string, number>();

    for (const interview of items) {
      const idKey =
        interview.id !== null && interview.id !== undefined
          ? `id:${String(interview.id)}`
          : null;

      // Clé de secours si les deux services renvoient des IDs différents
      const dataKey = [
        this.normalizeValue(interview.candidateName),
        this.normalizeValue(interview.posteRecrutement),
        this.normalizeValue(interview.interviewDate),
        this.normalizeValue(interview.startTime),
        this.normalizeValue(interview.endTime),
      ].join('|');

      let existingIndex: number | undefined;

      if (idKey) {
        existingIndex = indexes.get(idKey);
      }

      if (existingIndex === undefined) {
        existingIndex = indexes.get(`data:${dataKey}`);
      }

      if (existingIndex === undefined) {
        existingIndex = uniqueInterviews.push(interview) - 1;
      }

      if (idKey) {
        indexes.set(idKey, existingIndex);
      }

      indexes.set(`data:${dataKey}`, existingIndex);
    }

    return uniqueInterviews;
  }

  private normalizeValue(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  get visibleInterviews(): Interview[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.interviews.filter((i) => {
      const cn = (i.candidateName || '').toLowerCase();
      const pr = (i.posteRecrutement || '').toLowerCase();
      const ir = (i.interviewerName || '').toLowerCase();
      const matches =
        !term || cn.includes(term) || pr.includes(term) || ir.includes(term);
      return matches && this.selectedStatuses.has(i.status);
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredInterviews = this.interviews.filter((i) => {
      const matchesSearch =
        !term ||
        i.candidateName.toLowerCase().includes(term) ||
        i.posteRecrutement.toLowerCase().includes(term) ||
        i.interviewerName.toLowerCase().includes(term);
      const matchesStatus =
        !this.statusFilter || i.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
    this.page = 1;
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  toggleStatus(status: string): void {
    if (this.selectedStatuses.has(status)) this.selectedStatuses.delete(status);
    else this.selectedStatuses.add(status);
    this.refreshCalendarEvents();
  }

  isStatusVisible(status: string): boolean {
    return this.selectedStatuses.has(status);
  }

  get agendaGroups(): AgendaGroup[] {
    const map = new Map<string, Interview[]>();
    this.visibleInterviews.forEach((i) => {
      const list = map.get(i.interviewDate) || [];
      list.push(i);
      map.set(i.interviewDate, list);
    });
    const todayIso = this.toLocalIso(new Date());
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, items]) => {
        const d = new Date(iso + 'T00:00:00');
        return {
          iso,
          dayNumber: String(d.getDate()).padStart(2, '0'),
          weekday: this.capitalize(
            d.toLocaleDateString('fr-FR', { weekday: 'long' }),
          ),
          monthYear: this.capitalize(
            d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          ),
          isToday: iso === todayIso,
          items: [...items].sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          ),
        };
      });
  }

  get periodLabel(): string {
    return this.capitalize(
      this.miniCalendarDate.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      }),
    );
  }

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  buildMiniCalendar(): void {
    const year = this.miniCalendarDate.getFullYear();
    const month = this.miniCalendarDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startDow);
    const todayIso = this.toLocalIso(new Date());
    const weeks: MiniDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const week: MiniDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * 7 + d);
        const iso = this.toLocalIso(date);
        week.push({
          date,
          iso,
          day: date.getDate(),
          inMonth: date.getMonth() === month,
          isToday: iso === todayIso,
          isSelected: iso === this.selectedIso,
          hasEvents: !!this.eventCountByDate[iso],
        });
      }
      weeks.push(week);
    }
    this.miniWeeks = weeks;
  }

  prevMonth(): void {
    this.miniCalendarDate = new Date(
      this.miniCalendarDate.getFullYear(),
      this.miniCalendarDate.getMonth() - 1,
      1,
    );
    this.buildMiniCalendar();
  }

  nextMonth(): void {
    this.miniCalendarDate = new Date(
      this.miniCalendarDate.getFullYear(),
      this.miniCalendarDate.getMonth() + 1,
      1,
    );
    this.buildMiniCalendar();
  }

  goToday(): void {
    const now = new Date();
    this.miniCalendarDate = now;
    this.selectedIso = this.toLocalIso(now);
    this.buildMiniCalendar();
    this.calendarComponent?.getApi()?.today();
    this.scrollToDate(this.selectedIso);
  }

  selectMiniDay(day: MiniDay): void {
    this.selectedIso = day.iso;
    if (!day.inMonth) this.miniCalendarDate = day.date;
    this.buildMiniCalendar();
    this.calendarComponent?.getApi()?.gotoDate(day.date);
    this.scrollToDate(day.iso);
  }

  private scrollToDate(iso: string): void {
    if (this.view !== 'agenda') return;
    setTimeout(() => {
      document
        .getElementById('jour-' + iso)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  setView(v: 'agenda' | 'day' | 'week' | 'month'): void {
    this.view = v;
    if (v === 'agenda') return;
    const map: Record<string, string> = {
      day: 'timeGridDay',
      week: 'timeGridWeek',
      month: 'dayGridMonth',
    };
    setTimeout(() => this.calendarComponent?.getApi()?.changeView(map[v]));
  }

  refreshCalendarEvents(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.visibleInterviews.map((i) => ({
        id: String(i.id),
        title: `${i.candidateName} — ${i.posteRecrutement}`,
        start: `${i.interviewDate}T${i.startTime}`,
        end: `${i.interviewDate}T${i.endTime}`,
        backgroundColor: STATUS_COLORS[i.status],
        borderColor: STATUS_COLORS[i.status],
        extendedProps: { interview: i },
      })),
    };
  }

  computeStats(): void {
    const counts: Record<string, number> = {};
    this.statuses.forEach((s) => (counts[s] = 0));
    this.interviews.forEach(
      (i) => (counts[i.status] = (counts[i.status] || 0) + 1),
    );
    this.statusCounts = counts;
    this.barChartData = {
      labels: Object.keys(counts).map((s) => STATUS_LABELS[s] || s),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: Object.keys(counts).map((s) => STATUS_COLORS[s]),
        },
      ],
    };
  }

  private computeEventCountByDate(): void {
    const counts: Record<string, number> = {};
    this.interviews.forEach((i) => {
      counts[i.interviewDate] = (counts[i.interviewDate] || 0) + 1;
    });
    this.eventCountByDate = counts;
  }

  private isRamadan(iso: string): boolean {
    return iso >= RAMADAN_2026.start && iso <= RAMADAN_2026.end;
  }

  private toLocalIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getDayCellClasses(date: Date): string[] {
    const classes: string[] = [];
    const iso = this.toLocalIso(date);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) classes.push('fc-day-weekend-tn');
    const holiday = this.holidayMap.get(iso);
    if (holiday)
      classes.push(
        holiday.type === 'national'
          ? 'fc-day-holiday-national'
          : 'fc-day-holiday-religious',
      );
    else if (this.isRamadan(iso)) classes.push('fc-day-ramadan');
    return classes;
  }

  private onDayCellMount(arg: DayCellMountArg): void {
    const iso = this.toLocalIso(arg.date);
    const holiday = this.holidayMap.get(iso);
    if (holiday) arg.el.setAttribute('title', holiday.label);
    else if (this.isRamadan(iso)) arg.el.setAttribute('title', 'Ramadan');
    const count = this.eventCountByDate[iso] || 0;
    if (count > BUSY_DAY_THRESHOLD) {
      const badge = document.createElement('div');
      badge.className = 'fc-day-busy-badge';
      badge.textContent = String(count);
      badge.title = `${count} entretiens`;
      const frame = arg.el.querySelector('.fc-daygrid-day-frame') || arg.el;
      frame.appendChild(badge);
    }
  }

  onDateSelect(arg: DateSelectArg): void {
    if (this.pendingPlanification) {
      const context = this.pendingPlanification;
      this.pendingPlanification = null;
      this.ouvrirPlanificationCandidature(context, arg.startStr);
      return;
    }
    this.openDialog({ selectedDate: arg.startStr });
  }

  onEventClick(arg: EventClickArg): void {
    const interview: Interview = arg.event.extendedProps['interview'];
    this.editInterview(interview);
  }

  openCreateDialog(): void {
    this.openDialog({});
  }

  editInterview(interview: Interview): void {
    this.openDialog({ interview });
  }

  deleteInterview(interview: Interview): void {
    Swal.fire({
      title: 'Supprimer cet entretien ?',
      text: `${interview.candidateName} — ${interview.posteRecrutement}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
    }).then((res) => {
      if (res.isConfirmed && interview.id) {
        this.interviewService.delete(interview.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé',
              timer: 1200,
              showConfirmButton: false,
            });
            this.loadInterviews();
          },
          error: () => Swal.fire('Erreur', 'La suppression a échoué.', 'error'),
        });
      }
    });
  }
  private openDialog(data: InterviewDialogData): void {
    const ref = this.dialog.open(InterviewFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
      data,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadInterviews();
    });
  }
}
