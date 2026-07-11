import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RHRoutingModule } from './rh-routing.module';
import { DashboardRHComponent } from './dashboard-rh/dashboard-rh.component';
import { RhProfileComponent } from './rh-profile/rh-profile.component';
import { ListUsersComponent } from './list-users/list-users.component';


@NgModule({
  declarations: [
    DashboardRHComponent,
    RhProfileComponent,
    ListUsersComponent
  ],
  imports: [
    CommonModule,
    RHRoutingModule
  ]
})
export class RHModule { }
