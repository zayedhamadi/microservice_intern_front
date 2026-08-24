import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { ReprogrammerService } from '../../../core/service/reporte-entretient.service';

@Component({
  selector: 'app-reprogrammer-entretien',
  templateUrl: './reprogrammer-entretien.component.html',
  styleUrl: './reprogrammer-entretien.component.css',
})
export class ReprogrammerEntretienComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  interviewId!: string;

  // Infos d'affichage passées en query params depuis la page précédente
  posteRecrutement = '';
  interviewerName = '';
  ancienneDate = '';

  selectedDateStr: string | null = null; // "yyyy-MM-dd"
  selectedTime = '09:00';
  motif = '';

  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly minDate = this.toDateOnly(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ); // demain min

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    height: 'auto',
    firstDay: 1,
    selectable: true,
    validRange: { start: this.minDate },
    dateClick: (arg: DateClickArg) => this.onDateClick(arg),
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reprogrammerService: ReprogrammerService,
  ) {}

  ngOnInit(): void {   this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    this.interviewId = this.route.snapshot.paramMap.get('interviewId') ?? '';
    const qp = this.route.snapshot.queryParamMap;
    this.posteRecrutement = qp.get('poste') ?? '';
    this.interviewerName = qp.get('intervenant') ?? '';
    this.ancienneDate = qp.get('ancienneDate') ?? '';

    if (!this.interviewId) {
      this.errorMessage = 'Entretien introuvable.';
    }
  }

  private toDateOnly(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  onDateClick(arg: DateClickArg): void {
    this.selectedDateStr = arg.dateStr;
    this.successMessage = null;
    this.errorMessage = null;
  }

  get peutConfirmer(): boolean {
    return (
      !!this.selectedDateStr &&
      !!this.selectedTime &&
      this.motif.trim().length > 0
    );
  }

  confirmer(): void {
    if (!this.peutConfirmer || this.isSubmitting) return;

    const nouvelleDateProposee = `${this.selectedDateStr}T${this.selectedTime}:00`;

    this.isSubmitting = true;
    this.errorMessage = null;

    this.reprogrammerService
      .demanderParCandidat(this.interviewId, {
        nouvelleDateProposee,
        motif: this.motif.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage =
            'Votre demande de report a été envoyée. Vous serez notifié(e) de la décision.';
          setTimeout(() => this.retour(), 1800);
        },
        error: (err: any) => {
          console.log(err);
          this.isSubmitting = false;
          this.errorMessage = err.message ?? "Impossible d'envoyer la demande.";
        },
      });
  }

  annulerSelection(): void {
    this.selectedDateStr = null;
    this.motif = '';
  }
  posteId!: string;
  retour(): void {
    this.router.navigate([
      '/candidat/consulterEtatEthistoriqueParDetailleDuneCandidatureSpecifique',
      this.posteId,
    ]);
  }
}