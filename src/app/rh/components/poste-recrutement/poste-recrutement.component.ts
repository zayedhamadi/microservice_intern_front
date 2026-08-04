import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { DepartementService } from '../../../core/service/departement.service';
import { NotificationService } from '../../../core/service/notification.service';
import { DepartementDTO } from '../../../core/models/departement';
import { TypeContrat, WorkType, StatusPosteRecrutement } from '../../../core/models/enums/enumPosteRecrutemnt';


interface StepDef {
  id: number;
  label: string;
  eyebrow: string;
}

interface OptionDef {
  value: string;
  label: string;
}

@Component({
  selector: 'app-poste-recrutement',
  templateUrl: './poste-recrutement.component.html',
  styleUrl: './poste-recrutement.component.css',
})
export class PosteRecrutementComponent implements OnInit {
  steps: StepDef[] = [
    { id: 1, label: 'Poste', eyebrow: 'Étape 1' },
    { id: 2, label: 'Description', eyebrow: 'Étape 2' },
    { id: 3, label: 'Compétences', eyebrow: 'Étape 3' },
    { id: 4, label: 'Conditions', eyebrow: 'Étape 4' },
    { id: 5, label: 'Publication', eyebrow: 'Étape 5' },
  ];

  currentStep = 1;
  submitting = false;

  departements: DepartementDTO[] = [];
  loadingDepartements = false;

  competenceInput = '';
  langueInput = '';

  posteForm: FormGroup;

  typeContratOptions: OptionDef[] = [
    { value: TypeContrat.CDI, label: 'CDI' },
    { value: TypeContrat.CDD, label: 'CDD' },
    { value: TypeContrat.FREELANCE, label: 'Freelance' },
    { value: TypeContrat.ALTERNANCE, label: 'Alternance' },
    { value: TypeContrat.CIVP, label: 'CIVP' },
    { value: TypeContrat.STAGE, label: 'Stage' },
  ];

  workTypeOptions: OptionDef[] = [
    { value: WorkType.SUR_SITE, label: 'Sur site' },
    { value: WorkType.HYBRIDE, label: 'Hybride' },
    { value: WorkType.DISTANCE, label: 'À distance' },
  ];

  constructor(
    private fb: FormBuilder,
    private posteService: PosteRecutementService,
    private departementService: DepartementService,
    private notification: NotificationService,
    private router: Router,
  ) {
    this.posteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      departementNom: ['', Validators.required],
      typeContrat: [TypeContrat.CDI, Validators.required],
      workType: [WorkType.SUR_SITE, Validators.required],
      lieu: ['', Validators.required],

      description: ['', [Validators.required, Validators.minLength(30)]],
      profilDemandeOfPoste: [
        '',
        [Validators.required, Validators.minLength(20)],
      ],
      niveauEtudeRequis: [''],
      anneesExperienceMin: [0, [Validators.required, Validators.min(0)]],

      competencesRequises: [[] as string[], Validators.required],
      languesRequises: [[] as string[]],

      salaire: [null],
      nombrePostes: [1, [Validators.required, Validators.min(1)]],
      datePosteRecrutement: [this.today(), Validators.required],
      dateExpirationPosteRecrutement: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDepartements();
  }


  private loadDepartements(): void {
    this.loadingDepartements = true;
    this.departementService.getAllDepartements().subscribe({
      next: (data) => {
        console.log(data)
        this.departements = data;
        this.loadingDepartements = false;
      },
      error: (error:any) => {
        console.log(error)
        this.loadingDepartements = false;
        this.notification.toastError(
          'Impossible de charger la liste des départements.',
        );
      },
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }


  goToStep(step: number): void {
    if (step < this.currentStep || this.isStepValid(this.currentStep)) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (
      this.isStepValid(this.currentStep) &&
      this.currentStep < this.steps.length
    ) {
      this.currentStep++;
    } else {
      this.markStepTouched(this.currentStep);
      this.notification.toastError(
        'Merci de compléter les champs obligatoires de cette étape.',
      );
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    const fieldsByStep: Record<number, string[]> = {
      1: ['titre', 'departementNom', 'typeContrat', 'workType', 'lieu'],
      2: ['description', 'profilDemandeOfPoste', 'anneesExperienceMin'],
      3: ['competencesRequises'],
      4: [
        'nombrePostes',
        'datePosteRecrutement',
        'dateExpirationPosteRecrutement',
      ],
      5: [],
    };
    return (fieldsByStep[step] || []).every(
      (f) => this.posteForm.get(f)?.valid,
    );
  }

  private markStepTouched(step: number): void {
    const fieldsByStep: Record<number, string[]> = {
      1: ['titre', 'departementNom', 'typeContrat', 'workType', 'lieu'],
      2: ['description', 'profilDemandeOfPoste', 'anneesExperienceMin'],
      3: ['competencesRequises'],
      4: [
        'nombrePostes',
        'datePosteRecrutement',
        'dateExpirationPosteRecrutement',
      ],
      5: [],
    };
    (fieldsByStep[step] || []).forEach((f) =>
      this.posteForm.get(f)?.markAsTouched(),
    );
  }

  get progressPercent(): number {
    return Math.round(((this.currentStep - 1) / (this.steps.length - 1)) * 100);
  }

  // ---------- Chip inputs (compétences / langues) ----------

  addCompetence(): void {
    const value = this.competenceInput.trim();
    if (!value) return;
    const current: string[] = this.posteForm.value.competencesRequises || [];
    if (!current.includes(value)) {
      this.posteForm.patchValue({ competencesRequises: [...current, value] });
    }
    this.competenceInput = '';
  }

  removeCompetence(skill: string): void {
    const current: string[] = this.posteForm.value.competencesRequises || [];
    this.posteForm.patchValue({
      competencesRequises: current.filter((c) => c !== skill),
    });
  }

  addLangue(): void {
    const value = this.langueInput.trim();
    if (!value) return;
    const current: string[] = this.posteForm.value.languesRequises || [];
    if (!current.includes(value)) {
      this.posteForm.patchValue({ languesRequises: [...current, value] });
    }
    this.langueInput = '';
  }

  removeLangue(langue: string): void {
    const current: string[] = this.posteForm.value.languesRequises || [];
    this.posteForm.patchValue({
      languesRequises: current.filter((l) => l !== langue),
    });
  }


  get contratLabel(): string {
    return (
      this.typeContratOptions.find(
        (o) => o.value === this.posteForm.value.typeContrat,
      )?.label || ''
    );
  }

  get workTypeLabel(): string {
    return (
      this.workTypeOptions.find(
        (o) => o.value === this.posteForm.value.workType,
      )?.label || ''
    );
  }

  get salaireDisplay(): string {
    const s = this.posteForm.value.salaire;
    return s
      ? `${Number(s).toLocaleString('fr-FR')} DT / mois`
      : 'Non communiqué';
  }

  // ---------- Submit ----------

  publish(): void {
    if (this.posteForm.invalid) {
      this.markStepTouched(1);
      this.markStepTouched(2);
      this.markStepTouched(3);
      this.markStepTouched(4);
      this.notification.warning(
        'Formulaire incomplet',
        'Merci de vérifier les champs obligatoires avant de publier.',
      );
      return;
    }

    this.submitting = true;
    const payload = {
      ...this.posteForm.value,
      status: StatusPosteRecrutement.OUVERT,
    };

    this.posteService.createPoste(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.notification
          .success(
            'Poste publié',
            'Votre offre est maintenant visible et les candidats ont été notifiés.',
          )
          .then(() => {
            this.router.navigate(['/rh/NewPosteRecrutement']);
          });
      },
      error: (err) => {
        console.error('Erreur lors de la publication du poste :', err);
        this.submitting = false;
        this.notification.error(
          'Échec de la publication',
          err?.error?.message || 'Une erreur est survenue, veuillez réessayer.',
        );
      },
    });
  }
}
