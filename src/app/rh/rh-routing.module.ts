import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardRHComponent } from './components/dashboard-rh/dashboard-rh.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './components/consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { SideBarComponent } from './sidebar/sidebar.component';

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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RHRoutingModule {}
