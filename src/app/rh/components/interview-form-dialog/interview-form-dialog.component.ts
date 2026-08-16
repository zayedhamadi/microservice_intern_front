import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-interview-form-dialog',
  standalone: false, // ou true selon votre architecture, ici on garde module-based
  templateUrl: './interview-form-dialog.component.html',
  styleUrls: ['./interview-form-dialog.component.scss'], // préférer scss
})
export class InterviewFormDialogComponent {
  form: FormGroup;
  isEdit = false;
  saving = false;

  // Ajout des modes/status pour éviter undefined
  modes = ['PRESENTIEL', 'DISTANCIEL', 'TELEPHONIQUE', 'VISIOCONFERENCE'];
  statuses = ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'REPORTE'];
  statusLabels: Record<string, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
    REPORTE: 'Reporté',
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
    private fb: FormBuilder,
    @Inject(MatDialogRef)
    private dialogRef: MatDialogRef<InterviewFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
  ) {
    this.isEdit = !!data?.interview?.id;
    const i = data?.interview || {};

    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);

    this.form = this.fb.group({
      candidateName: [
        i.candidateName || '',
        [Validators.required, Validators.minLength(2)],
      ],
      candidateEmail: [i.candidateEmail || '', Validators.email],
      posteRecrutement: [i.posteRecrutement || '', Validators.required],
      interviewerName: [i.interviewerName || '', Validators.required],
      interviewDate: [
        i.interviewDate ? new Date(i.interviewDate) : new Date(),
        Validators.required,
      ],
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
    return (this.form as FormGroup).controls;
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.f).forEach((control) => control.markAsTouched());
      Swal.fire(
        'Erreur',
        'Veuillez compléter tous les champs requis.',
        'warning',
      );
      return;
    }

    this.saving = true;

    const raw = this.form.getRawValue();

    // Formatage date
    const dateObj = new Date(raw.interviewDate);
    const interviewDateStr = dateObj.toISOString().split('T')[0];

    const payload = {
      ...raw,
      interviewDate: interviewDateStr,
      meetingLink: raw.mode === 'DISTANCIEL' ? raw.meetingLink : null,
      location: raw.mode === 'PRESENTIEL' ? raw.location : null,
    };

    // Simulaton requête API
    setTimeout(() => {
      this.saving = false;
      this.dialogRef.close(payload);
      this.snackBar.open(
        this.isEdit ? '✅ Entretien mis à jour' : '✅ Entretien planifié',
        'Fermer',
        { duration: 3000 },
      );
    }, 1000);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  getDialogTitle(): string {
    return this.isEdit ? "Modifier l'entretien" : 'Planifier un entretien';
  }
}
