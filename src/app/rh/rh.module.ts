import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { FullCalendarModule } from '@fullcalendar/angular';
import { QuillModule } from 'ngx-quill';
import { BaseChartDirective } from 'ng2-charts';
import { RHRoutingModule } from './rh-routing.module';

import { DashboardRHComponent } from './components/dashboard-rh/dashboard-rh.component';
import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './components/consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { PosteRecrutementComponent } from './components/poste-recrutement/poste-recrutement.component';
import { ListePosteRecrutementComponent } from './components/liste-poste-recrutement/liste-poste-recrutement.component';
import { ConsulterSpecificPosteRecrutementDetailleComponent } from './components/consulter-specific-poste-recrutement-detaille/consulter-specific-poste-recrutement-detaille.component';
import { ListeDepartementComponent } from './components/liste-departement/liste-departement.component';
import { EditPosteRecrutementDetailleComponent } from './components/edit-poste-recrutement-detaille/edit-poste-recrutement-detaille.component';
import { ConsulteLesPosteQuiLesCandidatsPostulentComponent } from './components/consulte-les-poste-qui-les-candidats-postulent/consulte-les-poste-qui-les-candidats-postulent.component';
import { ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent } from './components/consulte-liste-candidats-qui-postules-aune-poste-specifique/consulte-liste-candidats-qui-postules-aune-poste-specifique.component';
import { CalendrierRHComponent } from './components/calendrier-rh/calendrier-rh.component';
import { InterviewFormDialogComponent } from './components/interview-form-dialog/interview-form-dialog.component';
import { PlanifierEntretienCandidatureDialogComponent } from './components/planifier-entretien-candidature-dialog/planifier-entretien-candidature-dialog.component';
import { ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent } from './components/consulter-une-programme-specifique-decalendrier-dun-vue-table/consulter-une-programme-specifique-decalendrier-dun-vue-table.component';
import { InterviewDetailDialogComponent } from './components/interview-detail-dialog/interview-detail-dialog.component';

@NgModule({
  declarations: [
    DashboardRHComponent,
    SideBarComponent,
    ListUsersComponent,
    ConsulterProfilUserDetailsPerRHComponent,
    PosteRecrutementComponent,
    ListePosteRecrutementComponent,
    ConsulterSpecificPosteRecrutementDetailleComponent,
    ListeDepartementComponent,
    EditPosteRecrutementDetailleComponent,
    ConsulteLesPosteQuiLesCandidatsPostulentComponent,
    ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent,
    CalendrierRHComponent,
    InterviewFormDialogComponent,
    PlanifierEntretienCandidatureDialogComponent,
    ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent,
    InterviewDetailDialogComponent,
    ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RHRoutingModule,
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
export class RHModule {}
