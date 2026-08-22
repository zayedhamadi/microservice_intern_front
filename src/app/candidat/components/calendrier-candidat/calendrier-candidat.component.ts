import { Component, OnInit, ViewChild } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventClickArg,
  EventInput,
  DatesSetArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { InterviewType } from '../../../core/models/enums/enumPosteRecrutemnt';
import { Interview } from '../../../core/models/interview';
import { CandidatService } from '../../../core/service/candidat.service';
import { EntretienTypeFilter } from '../../../core/models/CandidatInterviewFilters';

@Component({
  selector: 'app-calendrier-candidat',
  templateUrl: './calendrier-candidat.component.html',
  styleUrl: './calendrier-candidat.component.css',
})
export class CalendrierCandidatComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  visibleEventsCount = 0;
  selectedDate: Date = new Date();
  filterText = '';
  currentViewTitle = '';
  isLoading = false;
  errorMessage: string | null = null;

  types: EntretienTypeFilter[] = [
    {
      key: InterviewType.RH_INITIAL,
      label: 'Entretien RH Initial',
      color: '#A78BFA',
      visible: true,
    },
    {
      key: InterviewType.RH_FINAL,
      label: 'Entretien RH Final',
      color: '#6D28D9',
      visible: true,
    },
    {
      key: InterviewType.TECHNIQUE,
      label: 'Entretien Technique',
      color: '#1E1B2E',
      visible: true,
    },
  ];

  private allEvents: EventInput[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: false,
    height: 'auto',
    firstDay: 1,
    events: [],
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    datesSet: (arg: DatesSetArg) => {
      this.currentViewTitle = arg.view.title;
      this.selectedDate = arg.view.currentStart;
    },
  };

  constructor(private candidatService: CandidatService) {}

  ngOnInit(): void {
    this.loadEntretiens();
  }

  private loadEntretiens(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.candidatService
      .getMesEntretiens({
        page: 0,
        size: 200,
        sortBy: 'dateEntretien',
        sortDir: 'asc',
      })
      .subscribe({
        next: (result) => {
          this.allEvents = result.content.map((interview) =>
            this.mapToEvent(interview),
          );
          this.isLoading = false;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des entretiens', err);
          this.errorMessage =
            'Impossible de charger vos entretiens pour le moment.';
          this.isLoading = false;
        },
      });
  }

  private mapToEvent(interview: Interview): EventInput {
    const typeConfig = this.types.find((t) => t.key === interview.type);
    const start =
      interview.interviewDate && interview.startTime
        ? `${interview.interviewDate}T${interview.startTime}:00`
        : undefined;
    const end =
      interview.interviewDate && interview.endTime
        ? `${interview.interviewDate}T${interview.endTime}:00`
        : undefined;

    return {
      id: interview.id,
      title: `${typeConfig?.label ?? 'Entretien'} - ${interview.posteRecrutement}`,
      start,
      end,
      color: typeConfig?.color ?? '#6D28D9',
      extendedProps: {
        type: interview.type,
        lieu: interview.location,
        recruteur: interview.interviewerName,
        statut: interview.status,
        mode: interview.mode,
        meetingLink: interview.meetingLink,
        notes: interview.notes,
      },
    };
  }

  changeView(
    view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth',
  ): void {
    this.calendarComponent.getApi().changeView(view);
  }

  isActiveView(view: string): boolean {
    return this.calendarComponent?.getApi().view.type === view;
  }

  today(): void {
    this.calendarComponent.getApi().today();
  }
  prev(): void {
    this.calendarComponent.getApi().prev();
  }
  next(): void {
    this.calendarComponent.getApi().next();
  }

  onMiniCalendarSelect(date: Date): void {
    this.selectedDate = date;
    this.calendarComponent.getApi().gotoDate(date);
  }

  toggleType(type: EntretienTypeFilter): void {
    type.visible = !type.visible;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const activeTypes = this.types.filter((t) => t.visible).map((t) => t.key);
    const search = this.filterText.trim().toLowerCase();

    const filtered = this.allEvents.filter((ev) => {
      const matchesType = activeTypes.includes(ev.extendedProps?.['type']);
      const matchesSearch =
        !search || (ev.title as string).toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });

    const api = this.calendarComponent?.getApi();
    if (!api) return;
    api.removeAllEvents();this.visibleEventsCount = filtered.length;
    filtered.forEach((ev) => api.addEvent(ev));
  }

  private onEventClick(arg: EventClickArg): void {
    const props = arg.event.extendedProps;
    // TODO: ouvrir un MatDialog avec les détails (lieu, recruteur, statut, lien visio, notes...)
    console.log('Entretien sélectionné', {
      titre: arg.event.title,
      debut: arg.event.start,
      lieu: props['lieu'],
      recruteur: props['recruteur'],
      statut: props['statut'],
      meetingLink: props['meetingLink'],
    });
  }
}
