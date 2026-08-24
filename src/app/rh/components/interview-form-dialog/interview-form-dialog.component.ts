import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
import { Interview } from '../../../core/models/interview';
import { findConflicts } from '../../../core/models/utils/interview-conflict.util';
import { InterviewService } from '../../../core/service/interview.service';



export interface InterviewFormDialogData {
  interview?: Interview | null;
  allInterviews?: Interview[]; // liste déjà chargée, utilisée pour le contrôle de conflits (item 7)
  selectedDate?: string; // 'yyyy-MM-dd', pré-rempli si on vient d'un clic sur le calendrier
}

@Component({
  selector: 'app-interview-form-dialog',
  standalone: false,
  templateUrl: './interview-form-dialog.component.html',
  // ⚠️ BUG FIX : le .ts référençait un fichier .scss qui n'existe pas (le fichier réel est .css).
  styleUrls: ['./interview-form-dialog.component.css'],
})
export class InterviewFormDialogComponent {
  form: FormGroup;
  isEdit = false;
  saving = false;

  // ⚠️ BUG FIX : 'VISIOCONFERENCE' n'existe pas dans l'enum backend InterviewMode
  // (PRESENTIEL | DISTANCIEL | TELEPHONIQUE) — retiré.
  modes = ['PRESENTIEL', 'DISTANCIEL', 'TELEPHONIQUE'];

  // ⚠️ BUG FIX : CONFIRME et ABSENT manquaient (présents dans l'enum backend InterviewStatus).
  statuses = [
    'PLANIFIE',
    'CONFIRME',
    'EN_COURS',
    'TERMINE',
    'ANNULE',
    'REPORTE',
    'ABSENT',
  ];

  statusLabels: Record<string, string> = {
    PLANIFIE: 'Planifié',
    CONFIRME: 'Confirmé',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
    REPORTE: 'Reporté',
    ABSENT: 'Absent',
  };

  minDate: Date;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  constructor(
    private interviewService: InterviewService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InterviewFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InterviewFormDialogData,
    private snackBar: MatSnackBar,
  ) {
    this.isEdit = !!data?.interview?.id;
    const i = data?.interview || ({} as Partial<Interview>);

    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);

    const dateInitiale = i.interviewDate
      ? new Date(i.interviewDate)
      : data?.selectedDate
        ? new Date(data.selectedDate)
        : new Date();

    this.form = this.fb.group({
      candidateName: [
        i.candidateName || '',
        [Validators.required, Validators.minLength(2)],
      ],
      candidateEmail: [i.candidateEmail || '', Validators.email],
      posteRecrutement: [i.posteRecrutement || '', Validators.required],
      interviewerName: [i.interviewerName || '', Validators.required],
      interviewDate: [dateInitiale, Validators.required],
      startTime: [i.startTime || '09:00', Validators.required],
      endTime: [i.endTime || '10:00', [Validators.required]],
      mode: [i.mode || 'PRESENTIEL', Validators.required],
      location: [i.location || ''],
      meetingLink: [i.meetingLink || ''],
      status: [i.status || 'PLANIFIE', Validators.required],
      notes: [i.notes || ''],
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dateObj = new Date(raw.interviewDate);
    const interviewDate = dateObj.toISOString().split('T')[0];

    // item 7 : détection de conflit avant envoi
    const conflits = findConflicts(
      this.data.allInterviews ?? [],
      {
        interviewerName: raw.interviewerName,
        interviewDate,
        startTime: raw.startTime,
        endTime: raw.endTime,
      },
      this.data?.interview?.id,
    );

    if (conflits.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: "Conflit d'horaire détecté",
        html: `<b>${raw.interviewerName}</b> a déjà un entretien avec
               <b>${conflits[0].candidateName}</b> à ${conflits[0].startTime} ce jour-là.`,
        showCancelButton: true,
        confirmButtonText: 'Planifier quand même',
        cancelButtonText: 'Corriger',
      }).then((res) => {
        if (res.isConfirmed) this.doSubmit(raw, interviewDate);
      });
      return;
    }

    this.doSubmit(raw, interviewDate);
  }

  private doSubmit(raw: any, interviewDate: string): void {
    this.saving = true;
    const payload = {
      ...raw,
      interviewDate,
      meetingLink: raw.mode === 'DISTANCIEL' ? raw.meetingLink : null,
      location: raw.mode === 'PRESENTIEL' ? raw.location : null,
    };

    const request$ = this.isEdit
      ? this.interviewService.update(this.data.interview!.id!, payload)
      : this.interviewService.create(payload);

    request$.subscribe({
      next: (result) => {
        this.saving = false;
        this.dialogRef.close(result);
        this.snackBar.open(
          this.isEdit ? 'Entretien mis à jour' : 'Entretien planifié',
          'Fermer',
          { duration: 3000 },
        );
      },
      error: (err) => {
        this.saving = false;
        Swal.fire(
          'Erreur',
          err?.error?.message ?? "L'enregistrement a échoué.",
          'error',
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  getDialogTitle(): string {
    return this.isEdit ? "Modifier l'entretien" : 'Planifier un entretien';
  }
}
