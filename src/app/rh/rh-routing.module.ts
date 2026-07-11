import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardRHComponent } from './dashboard-rh/dashboard-rh.component';

const routes: Routes = [
  { path: 'dashboardRH', component: DashboardRHComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RHRoutingModule { }
