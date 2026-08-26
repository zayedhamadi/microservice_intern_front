import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { Interview } from '../../../core/models/interview';
import {
  PlanificationCandidatureContext,
  PlanifierEntretienPayload,
  RecrutementInterviewType,
} from '../../../core/service/recrutement-interview.service';

export interface PlanifierEntretienDialogData {
  context: PlanificationCandidatureContext;
  selectedDate?: string;
  allInterviews?: Interview[]; // ✅ Liste des entretiens existants pour le contrôle
}

export interface PlanifierEntretienDialogResult {
  type: RecrutementInterviewType;
  payload: PlanifierEntretienPayload;
}

@Component({
  selector: 'app-planifier-entretien-candidature-dialog',
  templateUrl: './planifier-entretien-candidature-dialog.component.html',
  styleUrls: ['./planifier-entretien-candidature-dialog.component.css'],
})
export class PlanifierEntretienCandidatureDialogComponent implements OnInit {
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
      PlanifierEntretienCandidatureDialogComponent,
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
    // BUG FIX : lienVisio n'est plus obligatoire — le backend
    // (GoogleMeetService) génère automatiquement le lien Google Meet, ce
    // qui correspond d'ailleurs déjà à la bannière affichée dans le HTML
    // ("Un lien Google Meet sera généré automatiquement...").
    if (mode === 'DISTANCIEL') {
      lienVisio.setValidators([Validators.pattern(/^https?:\/\/.+$/i)]);
    }

    lieu.updateValueAndValidity({ emitEvent: false });
    lienVisio.updateValueAndValidity({ emitEvent: false });
  }

  private toMinutes(timeStr?: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  /**
   * Vérifie si un autre entretien non annulé est déjà prévu le même jour
   * et sur la même plage horaire (par défaut 60 minutes).
   */
  private chercherConflitHoraire(
    dateIso: string,
    heureDebut: string,
    dureeMinutes = 60,
  ): Interview | null {
    const interviews = this.data.allInterviews || [];
    const debutNouveau = this.toMinutes(heureDebut);
    const finNouveau = debutNouveau + dureeMinutes;

    for (const interview of interviews) {
      // Ignorer les entretiens annulés
      if (interview.status === 'ANNULE') {
        continue;
      }

      // Même date sélectionnée (YYYY-MM-DD)
      if (interview.interviewDate === dateIso) {
        if (!interview.startTime) continue;

        const debutExistant = this.toMinutes(interview.startTime);
        const finExistant = interview.endTime
          ? this.toMinutes(interview.endTime)
          : debutExistant + 60;

        // Condition de chevauchement d'intervalles
        const chevauchement =
          debutNouveau < finExistant && finNouveau > debutExistant;

        if (chevauchement) {
          return interview;
        }
      }
    }

    return null;
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

    // Extraction de la date (YYYY-MM-DD) et de l'heure (HH:mm)
    const dateChoisie = v.dateEntretien.substring(0, 10);
    const heureChoisie = v.dateEntretien.substring(11, 16);

    // ⛔ CONTRÔLE DE DISPONIBILITÉ DU CRÉNEAU
    const entretienConflit = this.chercherConflitHoraire(
      dateChoisie,
      heureChoisie,
    );

    if (entretienConflit) {
      const nomCandidat = entretienConflit.candidateName || 'un autre candidat';
      const heurePlage = entretienConflit.endTime
        ? `${entretienConflit.startTime} à ${entretienConflit.endTime}`
        : `${entretienConflit.startTime}`;

      Swal.fire({
        icon: 'warning',
        title: 'Créneau indisponible',
        html: `
          <p style="font-size: 14px; color: #475569; text-align: left; margin: 0;">
            Un entretien est déjà planifié le <strong>${dateChoisie}</strong> à cette heure avec 
            <strong>${nomCandidat}</strong> (${heurePlage}).
          </p>
          <p style="font-size: 13.5px; color: #ef4444; font-weight: 600; text-align: left; margin-top: 10px;">
            Veuillez sélectionner un autre horaire pour éviter tout chevauchement.
          </p>
        `,
        confirmButtonText: 'Modifier l’heure',
        confirmButtonColor: '#4f46e5',
      });
      return; // Bloque la validation, la modale reste ouverte
    }

    const dateEntretien =
      v.dateEntretien.length === 16 ? `${v.dateEntretien}:00` : v.dateEntretien;

    this.dialogRef.close({
      type: v.typeEntretien,
      payload: {
        mode: v.mode,
        dateEntretien,
        lieu: v.mode === 'PRESENTIEL' ? v.lieu.trim() : undefined,
        // BUG FIX : n'envoyer lienVisio que s'il a été rempli manuellement ;
        // sinon on laisse undefined pour que le backend génère le lien.
        lienVisio:
          v.mode === 'DISTANCIEL' && v.lienVisio.trim()
            ? v.lienVisio.trim()
            : undefined,
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
