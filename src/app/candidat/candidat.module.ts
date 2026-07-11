import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CandidatRoutingModule } from './candidat-routing.module';
import { DashboardCandidatComponent } from './dashboard-candidat/dashboard-candidat.component';


@NgModule({
  declarations: [
    DashboardCandidatComponent
  ],
  imports: [
    CommonModule,
    CandidatRoutingModule
  ]
})
export class CandidatModule { }
