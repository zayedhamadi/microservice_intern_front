import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CandidatRoutingModule } from './candidat-routing.module';
import { DashboardCandidatComponent } from './components/dashboard-candidat/dashboard-candidat.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MesCandidaturesComponent } from './components/mes-candidatures/mes-candidatures.component';
import { ConsulterSpecificPosteRecrutementComponent } from './components/consulter-specific-poste-recrutement/consulter-specific-poste-recrutement.component';
import { PostuleraCandidatSpecificComponent } from './components/postulera-candidat-specific/postulera-candidat-specific.component';
import { EnregistrerPostePourPostulerApresComponent } from './components/enregistrer-poste-pour-postuler-apres/enregistrer-poste-pour-postuler-apres.component';
import { EditMyCondidateForSpeceficPostComponent } from './components/edit-my-condidate-for-specefic-post/edit-my-condidate-for-specefic-post.component';
import { PostesRecommandesComponent } from './components/postes-recommandes/postes-recommandes.component';
import { CalendrierCandidatComponent } from './components/calendrier-candidat/calendrier-candidat.component';

@NgModule({
  declarations: [
    DashboardCandidatComponent,
    MesCandidaturesComponent,
    ConsulterSpecificPosteRecrutementComponent,
    PostuleraCandidatSpecificComponent,
    EnregistrerPostePourPostulerApresComponent,
    EditMyCondidateForSpeceficPostComponent,
    PostesRecommandesComponent,
    CalendrierCandidatComponent,
  ],
  imports: [
    CommonModule,
    CandidatRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CandidatModule {}
