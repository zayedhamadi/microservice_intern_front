import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeRoutingModule } from './employee-routing.module';
import { DashboardEmployeeComponent } from './components/dashboard-employee/dashboard-employee.component';
import { CreateEmployeeComponent } from './components/create-employee/create-employee.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [DashboardEmployeeComponent, CreateEmployeeComponent],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class EmployeeModule {}
