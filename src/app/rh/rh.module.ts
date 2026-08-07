import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RHRoutingModule } from './rh-routing.module';
import { DashboardRHComponent } from './components/dashboard-rh/dashboard-rh.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './components/consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { SideBarComponent } from './sidebar/sidebar.component';
import { PosteRecrutementComponent } from './components/poste-recrutement/poste-recrutement.component';
import { ListePosteRecrutementComponent } from './components/liste-poste-recrutement/liste-poste-recrutement.component';
import { ConsulterSpecificPosteRecrutementDetailleComponent } from './components/consulter-specific-poste-recrutement-detaille/consulter-specific-poste-recrutement-detaille.component';
import { ListeDepartementComponent } from './components/liste-departement/liste-departement.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { EditPosteRecrutementDetailleComponent } from './components/edit-poste-recrutement-detaille/edit-poste-recrutement-detaille.component';
@NgModule({
  declarations: [
    DashboardRHComponent,
    SideBarComponent,
    ListUsersComponent,
    ConsulterProfilUserDetailsPerRHComponent,
    PosteRecrutementComponent,
    ListePosteRecrutementComponent,
    ConsulterSpecificPosteRecrutementDetailleComponent,
    ListeDepartementComponent,
    EditPosteRecrutementDetailleComponent,
  ],
  imports: [
    CommonModule,
    NgxPaginationModule,
    FormsModule,
    ReactiveFormsModule,
    RHRoutingModule,
  ],
})
export class RHModule {}
