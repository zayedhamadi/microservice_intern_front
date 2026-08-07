import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardRHComponent } from './components/dashboard-rh/dashboard-rh.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './components/consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { SideBarComponent } from './sidebar/sidebar.component';
import { ConsulterSpecificPosteRecrutementDetailleComponent } from './components/consulter-specific-poste-recrutement-detaille/consulter-specific-poste-recrutement-detaille.component';
import { ListePosteRecrutementComponent } from './components/liste-poste-recrutement/liste-poste-recrutement.component';
import { PosteRecrutementComponent } from './components/poste-recrutement/poste-recrutement.component';
import { ListeDepartementComponent } from './components/liste-departement/liste-departement.component';
import { EditPosteRecrutementDetailleComponent } from './components/edit-poste-recrutement-detaille/edit-poste-recrutement-detaille.component';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
    children: [
      { path: '', redirectTo: 'dashboardRH', pathMatch: 'full' },

      {
        path: 'dashboardRH',
        component: DashboardRHComponent,
        canActivate: [profileCompleteGuard],
      },
      {
        path: 'listUsers',
        component: ListUsersComponent,
        canActivate: [profileCompleteGuard],
      },
      {
        path: 'consulterprofilUser/:id',
        component: ConsulterProfilUserDetailsPerRHComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'ConsulterSpecificPosteRecrutementDetaille/:id',
        component: ConsulterSpecificPosteRecrutementDetailleComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'editSpecificPosteRecrutementDetaille/:id',
        component: EditPosteRecrutementDetailleComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'NewPosteRecrutement',
        component: PosteRecrutementComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'ListePosteRecrutement',
        component: ListePosteRecrutementComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'ListeDepartement',
        component: ListeDepartementComponent,
        canActivate: [profileCompleteGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RHRoutingModule {}
