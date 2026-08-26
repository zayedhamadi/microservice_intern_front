import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

import { Interview } from '../../../core/models/interview';
import { InterviewService } from '../../../core/service/interview.service';

export interface InterviewFormDialogData {
  interview?: Interview | null;
  allInterviews?: Interview[];
  selectedDate?: string;
}

@Component({
  selector: 'app-interview-form-dialog',
  standalone: false,
  templateUrl: './interview-form-dialog.component.html',
  styleUrls: ['./interview-form-dialog.component.css'],
})
export class InterviewFormDialogComponent {
  form: FormGroup;
  isEdit = false;
  saving = false;

  readonly modes = ['PRESENTIEL', 'DISTANCIEL', 'TELEPHONIQUE'];

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
    private readonly interviewService: InterviewService,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<InterviewFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: InterviewFormDialogData,
    private readonly snackBar: MatSnackBar,
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

  /**
   * Convertit une date (Date ou string) en format strict YYYY-MM-DD local
   */
  private formatIsoDate(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') {
      return d.includes('T') ? d.split('T')[0] : d;
    }
    if (d instanceof Date && !isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const interviewDate = this.formatIsoDate(raw.interviewDate);
    const heureDebut = raw.startTime ? raw.startTime.substring(0, 5) : '';
    const interviewIdActuelle = this.data.interview?.id;

    // ⛔ CONTRÔLE DE CONFLIT HORAIRE (Même jour & même heure)
    const conflit = (this.data.allInterviews || []).find((i: Interview) => {
      // Ignorer l'entretien en cours d'édition et les entretiens annulés
      if (i.id === interviewIdActuelle || i.status === 'ANNULE') {
        return false;
      }

      const dateExistante = this.formatIsoDate(i.interviewDate);
      const heureExistante = i.startTime ? i.startTime.substring(0, 5) : '';

      return dateExistante === interviewDate && heureExistante === heureDebut;
    });

    if (conflit) {
      const dateAffichee = new Date(
        interviewDate + 'T00:00:00',
      ).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      Swal.fire({
        icon: 'warning',
        title: 'Créneau horaire indisponible',
        html: `
          <p style="text-align:left; color:#334155; margin:0 0 10px 0; font-size:14px;">
            Un entretien est déjà programmé le <strong>${dateAffichee}</strong> à <strong>${heureDebut}</strong>.
          </p>
          <div style="text-align:left; background:#f8fafc; border:1px solid #e2e8f0; padding:10px 14px; border-radius:8px; font-size:13px; color:#64748b; margin-bottom:12px;">
            <div><strong>Candidat :</strong> ${conflit.candidateName}</div>
            <div><strong>Recruteur :</strong> ${conflit.interviewerName}</div>
          </div>
          <p style="text-align:left; color:#ef4444; font-weight:600; font-size:13px; margin:0;">
            Veuillez sélectionner une autre heure pour cet entretien.
          </p>
        `,
        confirmButtonText: "Modifier l'heure",
        confirmButtonColor: '#4f46e5',
      });
      return; // Bloque la validation, la modale reste ouverte
    }

    this.doSubmit(raw, interviewDate);
  }

  private doSubmit(raw: any, interviewDate: string): void {
    this.saving = true;
    const payload = {
      ...raw,
      interviewDate,
      // BUG FIX : n'envoyer meetingLink que s'il a été rempli manuellement ;
      // s'il est vide en DISTANCIEL, le backend génère le lien automatiquement.
      meetingLink:
        raw.mode === 'DISTANCIEL' && raw.meetingLink?.trim()
          ? raw.meetingLink.trim()
          : null,
      location: raw.mode === 'PRESENTIEL' ? raw.location : null,
    };

    const request$ = this.isEdit
      ? this.interviewService.update(this.data.interview!.id!, payload)
      : this.interviewService.create(payload);

    request$.subscribe({
      next: (result: any) => {
        this.saving = false;
        this.dialogRef.close(result);

        // BUG FIX : afficher le lien Meet généré automatiquement par le
        // backend, plutôt qu'un simple message de succès générique.
        if (raw.mode === 'DISTANCIEL' && result?.meetingLink) {
          Swal.fire({
            icon: 'success',
            title: this.isEdit ? 'Entretien mis à jour' : 'Entretien planifié',
            html: `
              <p style="text-align:left; font-size:14px; color:#334155; margin:0 0 10px;">
                Lien Google Meet généré :
              </p>
              <a href="${result.meetingLink}" target="_blank" rel="noopener"
                 style="word-break:break-all; color:#4f46e5; font-weight:600;">
                ${result.meetingLink}
              </a>
            `,
            confirmButtonText: 'Fermer',
            confirmButtonColor: '#4f46e5',
          });
        } else {
          this.snackBar.open(
            this.isEdit
              ? 'Entretien mis à jour avec succès.'
              : 'Entretien planifié avec succès.',
            'Fermer',
            { duration: 3000 },
          );
        }
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
