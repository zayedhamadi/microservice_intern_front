import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CandidatRoutingModule } from './candidat-routing.module';
import { DashboardCandidatComponent } from './dashboard-candidat/dashboard-candidat.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MesCandidaturesComponent } from './mes-candidatures/mes-candidatures.component';
import { ConsulterSpecificPosteRecrutementComponent } from './consulter-specific-poste-recrutement/consulter-specific-poste-recrutement.component';

@NgModule({
  declarations: [DashboardCandidatComponent, MesCandidaturesComponent, ConsulterSpecificPosteRecrutementComponent],
  imports: [
    CommonModule,
    CandidatRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CandidatModule {}
