import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FullCalendarModule,
  FullCalendarComponent,
} from '@fullcalendar/angular';
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
  InterviewStatus,
  InterviewDialogData,
} from '../../../core/models/interview';
import { InterviewService } from '../../../core/service/interview.service';
import { InterviewFormDialogComponent } from '../interview-form-dialog/interview-form-dialog.component';

const STATUS_COLORS: Record<string, string> = {
  PLANIFIE: '#3b82f6',
  CONFIRME: '#10b981',
  EN_COURS: '#f59e0b',
  TERMINE: '#6b7280',
  ANNULE: '#ef4444',
  REPORTE: '#8b5cf6',
};

interface HolidayInfo {
  date: string; // 'YYYY-MM-DD'
  label: string;
  type: 'national' | 'religious';
}

// Dates 2026 — fêtes nationales fixes + fêtes religieuses ESTIMÉES
// (calendrier lunaire hégirien, confirmation officielle par le Mufti de la
// République la veille de chaque fête — à ajuster de ±1 jour si besoin)
const TUNISIA_HOLIDAYS_2026: HolidayInfo[] = [
  { date: '2026-01-01', label: "Jour de l'An", type: 'national' },
  {
    date: '2026-01-14',
    label: 'Fête de la Révolution et de la Jeunesse',
    type: 'national',
  },
  { date: '2026-03-20', label: "Fête de l'Indépendance", type: 'national' },
  {
    date: '2026-03-20',
    label: 'Aïd el-Fitr (1er jour) — estimé',
    type: 'religious',
  },
  {
    date: '2026-03-21',
    label: 'Aïd el-Fitr (2e jour) — estimé',
    type: 'religious',
  },
  {
    date: '2026-03-22',
    label: 'Aïd el-Fitr (3e jour, admin.) — estimé',
    type: 'religious',
  },
  { date: '2026-04-09', label: 'Journée des Martyrs', type: 'national' },
  { date: '2026-05-01', label: 'Fête du Travail', type: 'national' },
  {
    date: '2026-05-26',
    label: 'Aïd el-Adha (1er jour) — estimé',
    type: 'religious',
  },
  {
    date: '2026-05-27',
    label: 'Aïd el-Adha (2e jour) — estimé',
    type: 'religious',
  },
  {
    date: '2026-06-15',
    label: 'Nouvel An musulman (Ras El Am El Hijri) — estimé',
    type: 'religious',
  },
  { date: '2026-07-25', label: 'Fête de la République', type: 'national' },
  { date: '2026-08-13', label: 'Fête de la Femme', type: 'national' },
  {
    date: '2026-08-24',
    label: 'Mouled (Anniversaire du Prophète) — estimé',
    type: 'religious',
  },
  { date: '2026-10-15', label: "Fête de l'Évacuation", type: 'national' },
];

// Ramadan 2026 estimé (29-30 jours avant l'Aïd el-Fitr)
const RAMADAN_2026 = { start: '2026-02-18', end: '2026-03-19' };

const BUSY_DAY_THRESHOLD = 3;

@Component({
  selector: 'app-calendrier-rh',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FullCalendarModule,
    NgxPaginationModule,
    BaseChartDirective,
  ],
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
  statusCounts: Record<string, number> = {};

  // ---- Filtre de statuts affichés sur le calendrier (sidebar) ----
  visibleStatuses = new Set<string>(
    Object.values(InterviewStatus) as unknown as string[],
  );

  // ---- Mini-calendrier de navigation (sidebar) ----
  miniCalendarMonth: Date = new Date();
  selectedMiniDate: Date | null = new Date();
  readonly miniWeekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  private searchSubject = new Subject<string>();
  private holidayMap = new Map<string, HolidayInfo>();
  eventCountByDate: Record<string, number> = {};

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
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    height: 'auto',
    selectable: true,
    editable: false,
    dayMaxEvents: 3,
    events: [],
    select: (arg: DateSelectArg) => this.onDateSelect(arg),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDidMount: (arg) => {
      const status = (arg.event.extendedProps as { status?: string })['status'];
      const color = (status && STATUS_COLORS[status]) || '#64748b';
      arg.el.style.setProperty('--ev-color', color);
    },
    eventsSet: () => {
      requestAnimationFrame(() => this.decorateListDayHeaders());
    },
    dayCellClassNames: (arg: DayCellContentArg) =>
      this.getDayCellClasses(arg.date),
    dayCellDidMount: (arg: DayCellMountArg) => this.onDayCellMount(arg),
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Agenda',
      year: 'Année',
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
    private interviewService: InterviewService,
    private dialog: MatDialog,
    private elRef: ElementRef<HTMLElement>,
  ) {
    this.searchSubject
      .pipe(debounceTime(350))
      .subscribe(() => this.applyFilters());

    TUNISIA_HOLIDAYS_2026.forEach((h) => this.holidayMap.set(h.date, h));
  }

  ngOnInit(): void {
    this.loadInterviews();
  }

  loadInterviews(): void {
    this.loading = true;
    this.interviewService.getAll().subscribe({
      next: (data) => {
        this.interviews = data;
        this.applyFilters();
        this.computeEventCountByDate();
        this.refreshCalendarEvents();
        this.computeStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de charger les entretiens.', 'error');
      },
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

  refreshCalendarEvents(): void {
    const evenementsVisibles = this.interviews.filter((i) =>
      this.visibleStatuses.has(i.status),
    );

    this.calendarOptions = {
      ...this.calendarOptions,
      events: evenementsVisibles.map((i) => ({
        id: String(i.id),
        title: `${i.candidateName} — ${i.posteRecrutement}`,
        start: `${i.interviewDate}T${i.startTime}`,
        end: `${i.interviewDate}T${i.endTime}`,
        backgroundColor: STATUS_COLORS[i.status],
        borderColor: STATUS_COLORS[i.status],
        extendedProps: { interview: i, status: i.status },
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
      labels: Object.keys(counts),
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
    const dow = date.getDay(); // 0 = dimanche, 6 = samedi

    if (dow === 0 || dow === 6) {
      classes.push('fc-day-weekend-tn');
    }

    const holiday = this.holidayMap.get(iso);
    if (holiday) {
      classes.push(
        holiday.type === 'national'
          ? 'fc-day-holiday-national'
          : 'fc-day-holiday-religious',
      );
    } else if (this.isRamadan(iso)) {
      classes.push('fc-day-ramadan');
    }

    return classes;
  }

  private onDayCellMount(arg: DayCellMountArg): void {
    const iso = this.toLocalIso(arg.date);
    const holiday = this.holidayMap.get(iso);

    if (holiday) {
      arg.el.setAttribute('title', holiday.label);
    } else if (this.isRamadan(iso)) {
      arg.el.setAttribute('title', 'Ramadan');
    }

    const count = this.eventCountByDate[iso] || 0;
    if (count > BUSY_DAY_THRESHOLD) {
      const badge = document.createElement('div');
      badge.className = 'fc-day-busy-badge';
      badge.textContent = String(count);
      badge.title = `${count} entretiens ce jour — journée chargée`;
      const frame = arg.el.querySelector('.fc-daygrid-day-frame') || arg.el;
      frame.appendChild(badge);
    }
  }

  /**
   * Habille les en-têtes de jour de la vue "Agenda" (listWeek/listMonth) :
   * gros numéro de jour + jour de semaine / mois, façon agenda.
   * Best-effort : si le DOM interne de FullCalendar diffère, on ne casse rien.
   */
  private decorateListDayHeaders(): void {
    const rows = this.elRef.nativeElement.querySelectorAll('tr.fc-list-day');
    rows.forEach((row) => {
      const dateAttr = row.getAttribute('data-date');
      const cushion = row.querySelector(
        '.fc-list-day-cushion',
      ) as HTMLElement | null;
      if (!dateAttr || !cushion || cushion.dataset['enhanced'] === 'true')
        return;

      const date = new Date(`${dateAttr}T00:00:00`);
      if (isNaN(date.getTime())) return;

      const dayNum = date.getDate();
      const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const monthYear = date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric',
      });

      cushion.dataset['enhanced'] = 'true';
      cushion.innerHTML = `
        <span class="agenda-daynum">${dayNum}</span>
        <span class="agenda-daymeta">
          <span class="agenda-weekday">${weekday}</span>
          <span class="agenda-monthyear">${monthYear}</span>
        </span>`;
    });
  }

  // ============================================================
  // Mini-calendrier (sidebar)
  // ============================================================

  get miniCalendarLabel(): string {
    return this.miniCalendarMonth.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  }

  get miniCalendarWeeks(): (Date | null)[][] {
    const year = this.miniCalendarMonth.getFullYear();
    const month = this.miniCalendarMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  prevMiniMonth(): void {
    this.miniCalendarMonth = new Date(
      this.miniCalendarMonth.getFullYear(),
      this.miniCalendarMonth.getMonth() - 1,
      1,
    );
  }

  nextMiniMonth(): void {
    this.miniCalendarMonth = new Date(
      this.miniCalendarMonth.getFullYear(),
      this.miniCalendarMonth.getMonth() + 1,
      1,
    );
  }

  goToMiniToday(): void {
    const now = new Date();
    this.miniCalendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.selectMiniDate(now);
  }

  selectMiniDate(date: Date): void {
    this.selectedMiniDate = date;
    this.calendarComponent?.getApi()?.gotoDate(date);
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    return this.isSameDay(date, new Date());
  }

  isSelectedMiniDate(date: Date | null): boolean {
    if (!date || !this.selectedMiniDate) return false;
    return this.isSameDay(date, this.selectedMiniDate);
  }

  hasEventsOnDay(date: Date | null): boolean {
    if (!date) return false;
    return (this.eventCountByDate[this.toLocalIso(date)] || 0) > 0;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // ============================================================
  // Filtre de statuts (sidebar)
  // ============================================================

  isStatusVisible(status: string): boolean {
    return this.visibleStatuses.has(status);
  }

  toggleStatusVisibility(status: string): void {
    if (this.visibleStatuses.has(status)) {
      this.visibleStatuses.delete(status);
    } else {
      this.visibleStatuses.add(status);
    }
    this.refreshCalendarEvents();
  }

  // ============================================================
  // Actions
  // ============================================================

  onDateSelect(arg: DateSelectArg): void {
    this.openDialog({ selectedDate: arg.startStr });
  }

  onEventClick(arg: EventClickArg): void {
    const interview: Interview = arg.event.extendedProps['interview'];
    this.openDialog({ interview });
  }

  openCreateDialog(): void {
    this.openDialog({});
  }

  editInterview(interview: Interview): void {
    this.openDialog({ interview });
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
}
