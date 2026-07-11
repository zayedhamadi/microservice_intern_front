import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCandidatComponent } from './dashboard-candidat/dashboard-candidat.component';

const routes: Routes = [  { path: 'dashboardcandidat', component: DashboardCandidatComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CandidatRoutingModule { }
