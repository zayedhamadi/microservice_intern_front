import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import Swal from 'sweetalert2';
import { PosteRecrutment } from '../../../core/models/PosteRecrutment';
import {
  StatusPosteRecrutement,
  TypeContrat,
  WorkType,
} from '../../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecutementService } from '../../../core/service/poste-recutement.service';
import { DepartementService } from '../../../core/service/departement.service';
import { DepartementDTO } from '../../../core/models/departement';

@Component({
  selector: 'app-edit-poste-recrutement-detaille',
  templateUrl: './edit-poste-recrutement-detaille.component.html',
  styleUrl: './edit-poste-recrutement-detaille.component.css',
})
export class EditPosteRecrutementDetailleComponent implements OnInit {
  posteId = '';
  form!: FormGroup;

  departements: DepartementDTO[] = [];
  typeContratEnum = Object.values(TypeContrat);
  workTypeEnum = Object.values(WorkType);
  statusEnum = Object.values(StatusPosteRecrutement);

  isLoading = true;
  hasError = false;
  isSaving = false;

  // champs texte libre pour compétences / langues (transformés en tableau)
  skillInput = '';
  langueInput = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private posteRecrutementService: PosteRecutementService,
    private departementService: DepartementService,
  ) {}

  ngOnInit(): void {
    this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    this.buildForm();
    this.loadDepartements();

    if (!this.posteId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.loadPoste();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      profilDemandeOfPoste: [''],
      competencesRequises: this.fb.array([]),
      languesRequises: this.fb.array([]),
      anneesExperienceMin: [0, [Validators.min(0)]],
      niveauEtudeRequis: [''],
      typeContrat: ['', Validators.required],
      status: ['', Validators.required],
      workType: ['', Validators.required],
      lieu: [''],
      salaire: [null, [Validators.min(0)]],
      nombrePostes: [1, [Validators.required, Validators.min(1)]],
      departementNom: ['', Validators.required],
      dateExpirationPosteRecrutement: [''],
    });
  }

  get competences(): FormArray {
    return this.form.get('competencesRequises') as FormArray;
  }

  get langues(): FormArray {
    return this.form.get('languesRequises') as FormArray;
  }

  addSkill(): void {
    const value = this.skillInput.trim();
    if (!value) return;
    this.competences.push(this.fb.control(value));
    this.skillInput = '';
  }

  removeSkill(index: number): void {
    this.competences.removeAt(index);
  }

  addLangue(): void {
    const value = this.langueInput.trim();
    if (!value) return;
    this.langues.push(this.fb.control(value));
    this.langueInput = '';
  }

  removeLangue(index: number): void {
    this.langues.removeAt(index);
  }

  loadDepartements(): void {
    this.departementService.getAllDepartements().subscribe({
      next: (data) => (this.departements = data ?? []),
      error: (err) => console.error('Erreur chargement départements :', err),
    });
  }

  loadPoste(): void {
    this.isLoading = true;
    this.hasError = false;

    this.posteRecrutementService.getPosteById(this.posteId).subscribe({
      next: (data: PosteRecrutment) => {
        this.patchForm(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement poste :', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  private patchForm(poste: PosteRecrutment): void {
    this.form.patchValue({
      titre: poste.titre,
      description: poste.description,
      profilDemandeOfPoste: poste.profilDemandeOfPoste,
      anneesExperienceMin: poste.anneesExperienceMin ?? 0,
      niveauEtudeRequis: poste.niveauEtudeRequis,
      typeContrat: poste.typeContrat,
      status: poste.status,
      workType: poste.workType,
      lieu: poste.lieu,
      salaire: poste.salaire,
      nombrePostes: poste.nombrePostes ?? 1,
      departementNom: poste.departementNom,
      dateExpirationPosteRecrutement: poste.dateExpirationPosteRecrutement
        ? poste.dateExpirationPosteRecrutement.substring(0, 10)
        : '',
    });

    this.competences.clear();
    (poste.competencesRequises ?? []).forEach((c) =>
      this.competences.push(this.fb.control(c)),
    );

    this.langues.clear();
    (poste.languesRequises ?? []).forEach((l) =>
      this.langues.push(this.fb.control(l)),
    );
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  goBack(): void {
    this.location.back();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire incomplet',
        text: 'Merci de vérifier les champs obligatoires avant de sauvegarder.',
        confirmButtonColor: '#7c5cff',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Enregistrer les modifications ?',
      text: 'Les changements seront appliqués immédiatement.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c5cff',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    this.isSaving = true;
    const payload = this.form.value;

    this.posteRecrutementService.updatePoste(this.posteId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        Swal.fire({
          icon: 'success',
          title: 'Poste mis à jour',
          timer: 1500,
          showConfirmButton: false,
        });
        this.router.navigate([
          '/rh/ConsulterSpecificPosteRecrutementDetaille',
          this.posteId,
        ]);
      },
      error: (err) => {
        console.error('Erreur mise à jour poste :', err);
        this.isSaving = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Impossible d'enregistrer les modifications pour le moment.",
          confirmButtonColor: '#0d6efd',
        });
      },
    });
  }

  async onCancel(): Promise<void> {
    if (this.form.dirty) {
      const result = await Swal.fire({
        title: 'Annuler les modifications ?',
        text: 'Les changements non enregistrés seront perdus.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'Oui, quitter',
        cancelButtonText: 'Rester',
      });
      if (!result.isConfirmed) return;
    }
    this.goBack();
  }
}
