import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardEmployeeComponent } from './components/dashboard-employee/dashboard-employee.component';
import { CreateEmployeeComponent } from './components/create-employee/create-employee.component';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterUserByAdminComponent } from './components/consulter-user-by-admin/consulter-user-by-admin.component';
import { DepartementComponent } from './components/departement/departement.component';
import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from '../communComponents/consulterlesliste-poste-par-employee-ou-candidat/consulterlesliste-poste-par-employee-ou-candidat.component';
import { ConsulterspecificposteseloncandidatandadminComponent } from '../communComponents/consulterspecificposteseloncandidatandadmin/consulterspecificposteseloncandidatandadmin.component';
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
    children: [
      { path: '', redirectTo: 'dashboardmanager', pathMatch: 'full' },

      {
        path: 'consulterlesPosteDisponibles',
        component: ConsulterleslistePosteParEmployeeOuCandidatComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['EMPLOYEE', 'CANDIDAT'] },
      },
      {
        path: 'consulterspecifiPosteDisponibles/:id',
        component: ConsulterspecificposteseloncandidatandadminComponent,
        canActivate: [AuthGuard, profileCompleteGuard],
        data: { roles: ['EMPLOYEE', 'CANDIDAT'] },
      },
      {
        path: 'listUsersManager',
        component: ListUsersComponent,
        canActivate: [profileCompleteGuard],
      },
      {
        path: 'dashboardmanager',
        component: DashboardEmployeeComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'departement',
        component: DepartementComponent,
        canActivate: [profileCompleteGuard],
      },
      {
        path: 'consulterUserByAdmin/:id',
        component: ConsulterUserByAdminComponent,
      },
      {
        path: 'createEmployee',
        component: CreateEmployeeComponent,
        canActivate: [profileCompleteGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
