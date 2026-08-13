import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
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
import { QuillModule } from 'ngx-quill';
import Swal from 'sweetalert2';
import { Interview, InterviewDialogData, InterviewMode, InterviewStatus } from '../../../core/models/interview';
import { InterviewService } from '../../../core/service/interview.service';





@Component({
  selector: 'app-interview-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    QuillModule,
  ],
  templateUrl: './interview-form-dialog.component.html',
  styleUrl: './interview-form-dialog.component.css',
})
export class InterviewFormDialogComponent {
  form: FormGroup;
  isEdit = false;
  saving = false;
  modes = Object.values(InterviewMode);
  statuses = Object.values(InterviewStatus);

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
    private interviewService: InterviewService,
    private dialogRef: MatDialogRef<InterviewFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InterviewDialogData,
  ) {
    this.isEdit = !!data.interview?.id;
    const i = data.interview;

    this.form = this.fb.group({
      candidateName: [
        i?.candidateName || '',
        [Validators.required, Validators.minLength(2)],
      ],
      candidateEmail: [i?.candidateEmail || '', [Validators.email]],
      posteRecrutement: [i?.posteRecrutement || '', Validators.required],
      interviewerName: [i?.interviewerName || '', Validators.required],
      interviewDate: [
        i?.interviewDate
          ? new Date(i.interviewDate)
          : data.selectedDate
            ? new Date(data.selectedDate)
            : new Date(),
        Validators.required,
      ],
      startTime: [i?.startTime || '09:00', Validators.required],
      endTime: [i?.endTime || '09:30', Validators.required],
      mode: [i?.mode || InterviewMode.PRESENTIEL, Validators.required],
      location: [i?.location || ''],
      meetingLink: [i?.meetingLink || ''],
      status: [i?.status || InterviewStatus.PLANIFIE, Validators.required],
      notes: [i?.notes || ''],
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
    if (this.f['startTime'].value >= this.f['endTime'].value) {
      Swal.fire(
        'Erreur',
        "L'heure de fin doit être après l'heure de début.",
        'error',
      );
      return;
    }

    this.saving = true;
    const raw = this.form.value;
    const payload: Interview = {
      ...raw,
      interviewDate: this.toIsoDate(raw.interviewDate),
    };

    const request =
      this.isEdit && this.data.interview?.id
        ? this.interviewService.update(this.data.interview.id, payload)
        : this.interviewService.create(payload);

    request.subscribe({
      next: (result) => {
        this.saving = false;
        Swal.fire({
          icon: 'success',
          title: this.isEdit ? 'Entretien mis à jour' : 'Entretien planifié',
          timer: 1500,
          showConfirmButton: false,
        });
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving = false;
        Swal.fire(
          'Erreur',
          err?.error?.message || 'Une erreur est survenue.',
          'error',
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private toIsoDate(date: Date): string {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
  }
}
