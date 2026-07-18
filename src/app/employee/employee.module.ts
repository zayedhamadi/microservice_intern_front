import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeRoutingModule } from './employee-routing.module';
import { DashboardEmployeeComponent } from './components/dashboard-employee/dashboard-employee.component';
import { CreateEmployeeComponent } from './components/create-employee/create-employee.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterUserByAdminComponent } from './consulter-user-by-admin/consulter-user-by-admin.component';

@NgModule({
  declarations: [DashboardEmployeeComponent, CreateEmployeeComponent, ListUsersComponent, ConsulterUserByAdminComponent],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class EmployeeModule {}
