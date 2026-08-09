import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCandidatComponent } from './components/dashboard-candidat/dashboard-candidat.component';
import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from '../communComponents/consulterlesliste-poste-par-employee-ou-candidat/consulterlesliste-poste-par-employee-ou-candidat.component';
import { ConsulterspecificposteseloncandidatandadminComponent } from '../communComponents/consulterspecificposteseloncandidatandadmin/consulterspecificposteseloncandidatandadmin.component';
import { MesCandidaturesComponent } from './components/mes-candidatures/mes-candidatures.component';
import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { ConsulterSpecificPosteRecrutementComponent } from './components/consulter-specific-poste-recrutement/consulter-specific-poste-recrutement.component';
import { EnregistrerPostePourPostulerApresComponent } from './components/enregistrer-poste-pour-postuler-apres/enregistrer-poste-pour-postuler-apres.component';
import { PostuleraCandidatSpecificComponent } from './components/postulera-candidat-specific/postulera-candidat-specific.component';
import { EditMyCondidateForSpeceficPostComponent } from './components/edit-my-condidate-for-specefic-post/edit-my-condidate-for-specefic-post.component';
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
        path: 'postulerAunePosteSpecific/:id',
        component: PostuleraCandidatSpecificComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['CANDIDAT'] },
      },
      {
        path: 'updatePosteForSpecificPoste/:id',
        component: EditMyCondidateForSpeceficPostComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['CANDIDAT'] },
      },
      {
        path: 'enregistrerPostePourPostulerApres/:id',
        component: EnregistrerPostePourPostulerApresComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['CANDIDAT'] },
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
