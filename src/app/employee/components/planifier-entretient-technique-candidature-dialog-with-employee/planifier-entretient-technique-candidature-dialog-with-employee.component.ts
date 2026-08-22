import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

import {
  PlanificationCandidatureContext,
  PlanifierEntretienPayload,
  RecrutementInterviewType,
} from '../../../core/service/recrutement-interview.service';

export interface PlanifierEntretienDialogData {
  context: PlanificationCandidatureContext;
  selectedDate?: string;
}

export interface PlanifierEntretienDialogResult {
  type: RecrutementInterviewType;
  payload: PlanifierEntretienPayload;
}
@Component({
  selector:
    'app-planifier-entretient-technique-candidature-dialog-with-employee',
  templateUrl:
    './planifier-entretient-technique-candidature-dialog-with-employee.component.html',
  // styleUrl: './planifier-entretient-technique-candidature-dialog-with-employee.component.css'
})
export class PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent implements OnInit {
  readonly typeLabels: Record<RecrutementInterviewType, string> = {
    'rh-initial': 'Entretien RH initial',
    technique: 'Entretien technique',
    'rh-final': 'Entretien RH final',
  };

  minDateTime: string;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<
      PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent,
      PlanifierEntretienDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public readonly data: PlanifierEntretienDialogData,
  ) {
    this.minDateTime = this.toLocalDateTimeInput(new Date());

    this.form = this.fb.nonNullable.group({
      typeEntretien: this.fb.nonNullable.control<RecrutementInterviewType>(
        this.data.context.typeEntretien,
        Validators.required,
      ),
      dateEntretien: this.fb.nonNullable.control(
        this.data.selectedDate
          ? this.toLocalDateTimeFromIsoDate(this.data.selectedDate)
          : '',
        Validators.required,
      ),
      mode: this.fb.nonNullable.control<PlanifierEntretienPayload['mode']>(
        'DISTANCIEL',
        Validators.required,
      ),
      lieu: this.fb.nonNullable.control(''),
      lienVisio: this.fb.nonNullable.control(''),
    });
  }

  ngOnInit(): void {
    this.form
      .get('mode')
      ?.valueChanges.subscribe(() => this.appliquerValidateursMode());
    this.appliquerValidateursMode();
  }

  get telephoneAutorise(): boolean {
    return this.form.get('typeEntretien')?.value === 'rh-initial';
  }

  private appliquerValidateursMode(): void {
    const mode = this.form.get('mode')?.value;
    const lieu = this.form.get('lieu');
    const lienVisio = this.form.get('lienVisio');
    if (!lieu || !lienVisio) return;

    lieu.clearValidators();
    lienVisio.clearValidators();

    if (mode === 'PRESENTIEL') {
      lieu.setValidators([Validators.required, Validators.maxLength(500)]);
    }
    if (mode === 'DISTANCIEL') {
      lienVisio.setValidators([
        Validators.required,
        Validators.pattern(/^https?:\/\/.+$/i),
      ]);
    }

    lieu.updateValueAndValidity({ emitEvent: false });
    lienVisio.updateValueAndValidity({ emitEvent: false });
  }

  enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const d = new Date(v.dateEntretien);

    if (Number.isNaN(d.getTime()) || d <= new Date()) {
      this.form.get('dateEntretien')?.setErrors({ datePassee: true });
      return;
    }

    const dateEntretien =
      v.dateEntretien.length === 16 ? `${v.dateEntretien}:00` : v.dateEntretien;

    this.dialogRef.close({
      type: v.typeEntretien,
      payload: {
        mode: v.mode,
        dateEntretien,
        lieu: v.mode === 'PRESENTIEL' ? v.lieu.trim() : undefined,
        lienVisio: v.mode === 'DISTANCIEL' ? v.lienVisio.trim() : undefined,
      },
    });
  }

  annuler(): void {
    this.dialogRef.close();
  }

  private toLocalDateTimeInput(date: Date): string {
    const p = (v: number) => String(v).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
  }

  private toLocalDateTimeFromIsoDate(iso: string): string {
    const d = new Date(iso + 'T10:00:00');
    return this.toLocalDateTimeInput(d);
  }
}

