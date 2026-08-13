import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardCandidatComponent } from './components/dashboard-candidat/dashboard-candidat.component';

import { MesCandidaturesComponent } from './components/mes-candidatures/mes-candidatures.component';

import { CalendrierCandidatComponent } from './components/calendrier-candidat/calendrier-candidat.component';

import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';

import { AuthGuard } from '../core/guards/auth.guard';

import { profileCompleteGuard } from '../core/guards/profile-complete.guard';

import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from '../communComponents/consulterlesliste-poste-par-employee-ou-candidat/consulterlesliste-poste-par-employee-ou-candidat.component';

import { ConsulterSpecificPosteRecrutementComponent } from './components/consulter-specific-poste-recrutement/consulter-specific-poste-recrutement.component';

import { EnregistrerPostePourPostulerApresComponent } from './components/enregistrer-poste-pour-postuler-apres/enregistrer-poste-pour-postuler-apres.component';

import { PostuleraCandidatSpecificComponent } from './components/postulera-candidat-specific/postulera-candidat-specific.component';

import { EditMyCondidateForSpeceficPostComponent } from './components/edit-my-condidate-for-specefic-post/edit-my-condidate-for-specefic-post.component';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,

    children: [
      // =========================
      // DEFAULT
      // =========================

      {
        path: '',
        redirectTo: 'dashboardcandidat',
        pathMatch: 'full',
      },

      // =========================
      // DASHBOARD
      // =========================

      {
        path: 'dashboardcandidat',
        component: DashboardCandidatComponent,
        canActivate: [profileCompleteGuard],
      },

      // =========================
      // CALENDRIER
      // =========================

      {
        path: 'calendrierCandidat',
        component: CalendrierCandidatComponent,
        canActivate: [profileCompleteGuard],
        data: {
          roles: ['CANDIDAT'],
        },
      },

      // =========================
      // POSTES
      // =========================

      {
        path: 'consulterlesPosteDisponibles',
        component: ConsulterleslistePosteParEmployeeOuCandidatComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['CANDIDAT'],
        },
      },

      {
        path: 'consulterspecifiPosteDisponibless/:id',
        component: ConsulterSpecificPosteRecrutementComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['CANDIDAT'],
        },
      },

      // =========================
      // CANDIDATURES
      // =========================

      {
        path: 'MesCandidatures',
        component: MesCandidaturesComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'postulerAunePosteSpecific/:id',
        component: PostuleraCandidatSpecificComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['CANDIDAT'],
        },
      },

      {
        path: 'updatePosteForSpecificPoste/:id',
        component: EditMyCondidateForSpeceficPostComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['CANDIDAT'],
        },
      },

      {
        path: 'enregistrerPostePourPostulerApres/:id',
        component: EnregistrerPostePourPostulerApresComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['CANDIDAT'],
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CandidatRoutingModule {}
