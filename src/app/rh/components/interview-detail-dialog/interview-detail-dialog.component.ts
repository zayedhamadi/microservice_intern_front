import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
import { Interview } from '../../../core/models/interview';
import { findConflicts } from '../../../core/models/utils/interview-conflict.util';
import { InterviewService } from '../../../core/service/interview.service';



export interface InterviewDetailDialogData {
  interview: Interview;
  allInterviews: Interview[];
  /** true = ouvre directement le mode "reporter" (utilisé par le bouton "Reprogrammer" de la liste) */
  openReporterDirect?: boolean;
}

type DialogMode = 'view' | 'reporter' | 'resultat';

@Component({
  selector: 'app-interview-detail-dialog',
  templateUrl: './interview-detail-dialog.component.html',
  styleUrls: ['./interview-detail-dialog.component.scss'],
})
export class InterviewDetailDialogComponent {
  interview: Interview;
  mode: DialogMode = 'view';
  saving = false;

  // ---- État du formulaire "reprogrammer" ----
  nouvelleDate: string;

  // ---- État du formulaire "résultat" ----
  resultat: 'REUSSI' | 'ECHOUE' | null = null;
  notesResultat = '';

  readonly typeLabels: Record<string, string> = {
    RH_INITIAL: 'RH Initial',
    TECHNIQUE: 'Technique',
    RH_FINAL: 'RH Final',
    LIBRE: 'Entretien libre',
  };

  readonly statusLabels: Record<string, string> = {
    PLANIFIE: 'Planifié',
    CONFIRME: 'Confirmé',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
    REPORTE: 'Reporté',
    ABSENT: 'Absent',
  };

  constructor(
    private dialogRef: MatDialogRef<InterviewDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InterviewDetailDialogData,
    public interviewService: InterviewService,
    private snackBar: MatSnackBar,
  ) {
    this.interview = data.interview;
    if (data.openReporterDirect) this.mode = 'reporter';
    this.nouvelleDate = `${this.interview.interviewDate}T${this.interview.startTime}`;
  }

  get isCandidature(): boolean {
    return this.interview.source === 'CANDIDATURE';
  }

  close(result?: Interview): void {
    this.dialogRef.close(result);
  }

  // ==================== Reprogrammer (item 5) ====================

  confirmerReport(): void {
    if (!this.nouvelleDate) return;
    const [date, time] = this.nouvelleDate.split('T');

    // item 7 : contrôle de conflit avant confirmation
    const conflits = findConflicts(
      this.data.allInterviews,
      {
        interviewerName: this.interview.interviewerName,
        interviewDate: date,
        startTime: time,
        endTime: this.addOneHour(time),
      },
      this.interview.id,
    );

    const executer = () => {
      this.saving = true;
      this.interviewService
        .reporterEntretien(this.interview.id!, this.nouvelleDate)
        .subscribe({
          next: (updated) => {
            this.saving = false;
            this.snackBar.open('Entretien reprogrammé', 'Fermer', {
              duration: 3000,
            });
            this.close(updated);
          },
          error: (err) => {
            this.saving = false;
            Swal.fire(
              'Erreur',
              err.message ?? 'La reprogrammation a échoué',
              'error',
            );
          },
        });
    };

    if (conflits.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: "Conflit d'horaire détecté",
        html: `<b>${this.interview.interviewerName}</b> a déjà un entretien à ce créneau avec
               <b>${conflits[0].candidateName}</b> (${conflits[0].startTime} - ${conflits[0].endTime}).`,
        showCancelButton: true,
        confirmButtonText: 'Reprogrammer quand même',
        cancelButtonText: 'Corriger',
      }).then((r) => {
        if (r.isConfirmed) executer();
      });
    } else {
      executer();
    }
  }

  // ==================== Annuler (item 6) ====================

  annuler(): void {
    Swal.fire({
      title: 'Annuler cet entretien ?',
      input: 'text',
      inputLabel: 'Motif (optionnel)',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Retour',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.saving = true;
      this.interviewService
        .annulerEntretien(this.interview.id!, res.value || undefined)
        .subscribe({
          next: (updated) => {
            this.saving = false;
            this.snackBar.open('Entretien annulé', 'Fermer', {
              duration: 3000,
            });
            this.close(updated);
          },
          error: (err) => {
            this.saving = false;
            Swal.fire(
              'Erreur',
              err.message ?? "L'annulation a échoué",
              'error',
            );
          },
        });
    });
  }

  // ==================== Marquer absent ====================

  marquerAbsent(): void {
    Swal.fire({
      title: 'Marquer le candidat absent ?',
      text: 'La candidature sera automatiquement rejetée.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.saving = true;
      this.interviewService.marquerAbsent(this.interview.id!).subscribe({
        next: (updated) => {
          this.saving = false;
          this.close(updated);
        },
        error: (err) => {
          this.saving = false;
          Swal.fire('Erreur', err.message ?? "L'action a échoué", 'error');
        },
      });
    });
  }

  // ==================== Résultat (workflow candidature) ====================

  enregistrerResultat(): void {
    if (!this.resultat) return;
    if (this.resultat === 'ECHOUE' && !this.notesResultat.trim()) {
      Swal.fire(
        'Note requise',
        'Une note est obligatoire pour un entretien échoué.',
        'warning',
      );
      return;
    }
    this.saving = true;
    this.interviewService
      .enregistrerResultat(this.interview.id!, {
        resultat: this.resultat as any,
        notes: this.notesResultat.trim() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.close(updated);
        },
        error: (err) => {
          this.saving = false;
          Swal.fire(
            'Erreur',
            err.message ?? "L'enregistrement a échoué",
            'error',
          );
        },
      });
  }

  private addOneHour(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h + 1, m, 0, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
