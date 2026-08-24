import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventClickArg,
  EventInput,
  DatesSetArg,
} from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import Swal from 'sweetalert2';
import { InterviewType } from '../../../core/models/enums/enumPosteRecrutemnt';
import { Interview } from '../../../core/models/interview';
import { CandidatService } from '../../../core/service/candidat.service';
import { EntretienTypeFilter } from '../../../core/models/CandidatInterviewFilters';
import { ReprogrammerService } from '../../../core/service/reporte-entretient.service'; // ajuste le chemin

interface ContexteReprogrammation {
  demandeId?: string;
  interviewId: string;
  candidateName?: string;
  returnUrl?: string;
}

const CLE_CONTEXTE_REPROGRAMMATION = 'reprogrammation_contexte';

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

  // ==================== Contexte "reprogrammation" ====================
  modeReprogrammation = false;
  contexteReprogrammation: ContexteReprogrammation | null = null;

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
    dateClick: (arg: DateClickArg) => this.onDateClick(arg.dateStr),
    datesSet: (arg: DatesSetArg) => {
      this.currentViewTitle = arg.view.title;
      this.selectedDate = arg.view.currentStart;
    },
  };

  constructor(
    private candidatService: CandidatService,
    private reprogrammerService: ReprogrammerService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.recupererContexteReprogrammation();
    this.loadEntretiens();
  }

  // ==================== Contexte reprogrammation ====================

  private recupererContexteReprogrammation(): void {
    const params = this.route.snapshot.queryParams;
    if (params['modeReprogrammation'] !== '1') return;

    const brut = sessionStorage.getItem(CLE_CONTEXTE_REPROGRAMMATION);
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
    sessionStorage.removeItem(CLE_CONTEXTE_REPROGRAMMATION);
    this.modeReprogrammation = false;
    this.contexteReprogrammation = null;
  }

  private terminerModeReprogrammation(): void {
    const returnUrl =
      this.contexteReprogrammation?.returnUrl ??
      '/candidat/demandes-reprogrammation'; // ⚠️ ajuste selon la vraie route côté candidat
    sessionStorage.removeItem(CLE_CONTEXTE_REPROGRAMMATION);
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
      title: 'Demander une nouvelle date',
      html: `
        <p style="margin-bottom:12px;color:#64748b;text-align:left;">
          Date sélectionnée : <strong>${dateAffichee}</strong>
        </p>
        <input id="swal-heure" type="time" class="swal2-input" placeholder="Heure">
        <textarea id="swal-motif" class="swal2-textarea" placeholder="Motif de la demande"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Envoyer la demande',
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
        .demanderParCandidat(interviewId, {
          nouvelleDateProposee,
          motif: res.value.motif,
        })
        .subscribe({
          next: () => {
            Swal.fire(
              'Envoyée',
              'Votre demande de reprogrammation a été envoyée.',
              'success',
            );
            this.terminerModeReprogrammation();
          },
          error: (err) =>
            Swal.fire(
              'Erreur',
              err?.message ?? "Impossible d'envoyer la demande.",
              'error',
            ),
        });
    });
  }

  // ==================== Chargement / affichage entretiens ====================

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
    api.removeAllEvents();
    this.visibleEventsCount = filtered.length;
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

  /** ✅ Clic sur une date : en mode reprogrammation, ouvre la demande candidat. Sinon, ne fait rien pour l'instant. */
  private onDateClick(dateStr: string): void {
    if (this.modeReprogrammation) {
      this.ouvrirPropositionReprogrammation(dateStr);
    }
  }
}
