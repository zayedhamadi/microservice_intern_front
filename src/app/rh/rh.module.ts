import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RHRoutingModule } from './rh-routing.module';
import { DashboardRHComponent } from './dashboard-rh/dashboard-rh.component';
import { RhProfileComponent } from './rh-profile/rh-profile.component';
import { ListUsersComponent } from './list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { SideBarComponent } from './sidebar/sidebar.component';

@NgModule({
  declarations: [
    DashboardRHComponent,
    RhProfileComponent,
    SideBarComponent,
    ListUsersComponent,
    ConsulterProfilUserDetailsPerRHComponent
  ],
  imports: [
    CommonModule,
    RHRoutingModule
  ]
})
export class RHModule { }
