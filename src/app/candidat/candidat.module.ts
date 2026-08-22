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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FullCalendarModule } from '@fullcalendar/angular';
import { BaseChartDirective } from 'ng2-charts';
import { NgxPaginationModule } from 'ngx-pagination';
import { QuillModule } from 'ngx-quill';
import { ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent } from './components/consulter-etat-ethistorique-par-detaille-dune-candidature-specifique/consulter-etat-ethistorique-par-detaille-dune-candidature-specifique.component';

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
    ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent,
  ],
  imports: [
    CandidatRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FullCalendarModule,
    QuillModule.forRoot(),
    BaseChartDirective,
  ],
})
export class CandidatModule {}
