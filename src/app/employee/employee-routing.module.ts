import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardEmployeeComponent } from './dashboard-employee/dashboard-employee.component';

const routes: Routes = [  { path: 'dashboardmanager', component: DashboardEmployeeComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule { }
