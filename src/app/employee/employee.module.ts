import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeRoutingModule } from './employee-routing.module';
import { DashboardEmployeeComponent } from './components/dashboard-employee/dashboard-employee.component';
import { CreateEmployeeComponent } from './components/create-employee/create-employee.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterUserByAdminComponent } from './components/consulter-user-by-admin/consulter-user-by-admin.component';
import { DepartementComponent } from './components/departement/departement.component';
import { CalendrierEmployeeComponent } from './components/calendrier-employee/calendrier-employee.component';
import { ListeUsersPourFaireEntretientTechniqueComponent } from './components/liste-users-pour-faire-entretient-technique/liste-users-pour-faire-entretient-technique.component';
import { InterviewEmployeeFormDialogComponent } from './components/interview-employee-form-dialog/interview-employee-form-dialog.component';
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
import { PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent } from './components/planifier-entretient-technique-candidature-dialog-with-employee/planifier-entretient-technique-candidature-dialog-with-employee.component';

@NgModule({
  declarations: [
    DashboardEmployeeComponent,
    CreateEmployeeComponent,
    ListUsersComponent,
    ConsulterUserByAdminComponent,
    DepartementComponent,
    CalendrierEmployeeComponent,
    ListeUsersPourFaireEntretientTechniqueComponent,
    InterviewEmployeeFormDialogComponent,
    PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent,
  ],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
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
export class EmployeeModule {}
    