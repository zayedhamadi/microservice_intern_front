import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCandidatComponent } from './dashboard-candidat/dashboard-candidat.component';
import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from '../communComponents/consulterlesliste-poste-par-employee-ou-candidat/consulterlesliste-poste-par-employee-ou-candidat.component';
import { ConsulterspecificposteseloncandidatandadminComponent } from '../communComponents/consulterspecificposteseloncandidatandadmin/consulterspecificposteseloncandidatandadmin.component';
import { MesCandidaturesComponent } from './mes-candidatures/mes-candidatures.component';
import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { ConsulterSpecificPosteRecrutementComponent } from './consulter-specific-poste-recrutement/consulter-specific-poste-recrutement.component';
const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
    children: [
      { path: '', redirectTo: 'dashboardcandidat', pathMatch: 'full' },
      { path: 'dashboardcandidat', component: DashboardCandidatComponent },
      { path: 'MesCandidatures', component: MesCandidaturesComponent },
      {
        path: 'consulterlesPosteDisponibles',
        component: ConsulterleslistePosteParEmployeeOuCandidatComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['EMPLOYEE', 'CANDIDAT'] },
      },
      {
        path: 'consulterspecifiPosteDisponibless/:id',
        component: ConsulterSpecificPosteRecrutementComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['EMPLOYEE', 'CANDIDAT'] },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CandidatRoutingModule {}
