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

@NgModule({
  declarations: [
    DashboardEmployeeComponent,
    CreateEmployeeComponent,
    ListUsersComponent,
    ConsulterUserByAdminComponent,
    DepartementComponent,
    CalendrierEmployeeComponent,
  ],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class EmployeeModule {}
