import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardEmployeeComponent } from './components/dashboard-employee/dashboard-employee.component';

import { CreateEmployeeComponent } from './components/create-employee/create-employee.component';

import { ListUsersComponent } from './components/list-users/list-users.component';

import { ConsulterUserByAdminComponent } from './components/consulter-user-by-admin/consulter-user-by-admin.component';

import { DepartementComponent } from './components/departement/departement.component';

import { CalendrierEmployeeComponent } from './components/calendrier-employee/calendrier-employee.component';

import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';

import { AuthGuard } from '../core/guards/auth.guard';

import { profileCompleteGuard } from '../core/guards/profile-complete.guard';

import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from '../communComponents/consulterlesliste-poste-par-employee-ou-candidat/consulterlesliste-poste-par-employee-ou-candidat.component';

import { ConsulterspecificposteseloncandidatandadminComponent } from '../communComponents/consulterspecificposteseloncandidatandadmin/consulterspecificposteseloncandidatandadmin.component';
import { ListeUsersPourFaireEntretientTechniqueComponent } from './components/liste-users-pour-faire-entretient-technique/liste-users-pour-faire-entretient-technique.component';
import { ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent } from '../communComponents/consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre/consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre.component';

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
        redirectTo: 'dashboardmanager',
        pathMatch: 'full',
      },

      // =========================
      // DASHBOARD
      // =========================

      {
        path: 'dashboardmanager',
        component: DashboardEmployeeComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'consulterlistUSersPourFaireDesEntretientTechniques',
        component: ListeUsersPourFaireEntretientTechniqueComponent,
        canActivate: [profileCompleteGuard],
      },

      // =========================
      // CALENDRIER
      // =========================

      {
        path: 'calendrierEmployee',
        component: CalendrierEmployeeComponent,
        canActivate: [profileCompleteGuard],
        data: {
          roles: ['EMPLOYEE'],
        },
      },

      // =========================
      // EMPLOYEES
      // =========================

      {
        path: 'listUsersManager',
        component: ListUsersComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'createEmployee',
        component: CreateEmployeeComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'consulterUserByAdmin/:id',
        component: ConsulterUserByAdminComponent,
        canActivate: [profileCompleteGuard],
      },

      // =========================
      // DEPARTEMENT
      // =========================

      {
        path: 'departement',
        component: DepartementComponent,
        canActivate: [profileCompleteGuard],
      },

      // =========================
      // POSTES
      // =========================

      {
        path: 'consulterlesPosteDisponibles',
        component: ConsulterleslistePosteParEmployeeOuCandidatComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['EMPLOYEE', 'CANDIDAT'],
        },
      },
      {
        path: 'demandes-reprogrammation',
        component:
          ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent,
        canActivate: [profileCompleteGuard],
        data: {
          roles: ['EMPLOYEE'],
        },
      },
      {
        path: 'consulterspecifiPosteDisponibles/:id',
        component: ConsulterspecificposteseloncandidatandadminComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: {
          roles: ['EMPLOYEE', 'CANDIDAT'],
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
