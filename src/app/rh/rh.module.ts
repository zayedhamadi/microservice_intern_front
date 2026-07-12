import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RHRoutingModule } from './rh-routing.module';
import { DashboardRHComponent } from './components/dashboard-rh/dashboard-rh.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './components/consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { SideBarComponent } from './sidebar/sidebar.component';

@NgModule({
  declarations: [
    DashboardRHComponent,
    SideBarComponent,
    ListUsersComponent,
    ConsulterProfilUserDetailsPerRHComponent,
  ],
  imports: [CommonModule, RHRoutingModule],
})
export class RHModule {}
