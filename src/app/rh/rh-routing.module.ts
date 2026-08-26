import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardRHComponent } from './components/dashboard-rh/dashboard-rh.component';
import { ListUsersComponent } from './components/list-users/list-users.component';
import { ConsulterProfilUserDetailsPerRHComponent } from './components/consulter-profil-user-details-per-rh/consulter-profil-user-details-per-rh.component';
import { SideBarComponent } from '../communComponents/sidebar/sidebar.component';
import { ConsulterSpecificPosteRecrutementDetailleComponent } from './components/consulter-specific-poste-recrutement-detaille/consulter-specific-poste-recrutement-detaille.component';
import { ListePosteRecrutementComponent } from './components/liste-poste-recrutement/liste-poste-recrutement.component';
import { PosteRecrutementComponent } from './components/poste-recrutement/poste-recrutement.component';
import { ListeDepartementComponent } from './components/liste-departement/liste-departement.component';
import { EditPosteRecrutementDetailleComponent } from './components/edit-poste-recrutement-detaille/edit-poste-recrutement-detaille.component';
import { ConsulteLesPosteQuiLesCandidatsPostulentComponent } from './components/consulte-les-poste-qui-les-candidats-postulent/consulte-les-poste-qui-les-candidats-postulent.component';
import { ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent } from './components/consulte-liste-candidats-qui-postules-aune-poste-specifique/consulte-liste-candidats-qui-postules-aune-poste-specifique.component';
import { CalendrierRHComponent } from './components/calendrier-rh/calendrier-rh.component';
import { InterviewFormDialogComponent } from './components/interview-form-dialog/interview-form-dialog.component';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent } from './components/consulter-une-programme-specifique-decalendrier-dun-vue-table/consulter-une-programme-specifique-decalendrier-dun-vue-table.component';
import { ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent } from '../communComponents/consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre/consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre.component';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,

    children: [
      {
        path: '',
        redirectTo: 'dashboardRH',
        pathMatch: 'full',
      },
      {
        path: 'ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTable/:id',
        component:
          ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent,
        canActivate: [profileCompleteGuard],
      },
     
      {
        path: 'demandes-reprogrammation',
        component:
          ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent,
        canActivate: [profileCompleteGuard],
        data: {
          roles: ['RH'],
        },
      },

      {
        path: 'dashboardRH',
        component: DashboardRHComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'calendrierRH',
        component: CalendrierRHComponent,
        canActivate: [profileCompleteGuard],
        data: {
          roles: ['RH'],
        },
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
        path: 'ConsulteLesPosteQuiLesCandidatsPostulent',
        component: ConsulteLesPosteQuiLesCandidatsPostulentComponent,
        canActivate: [profileCompleteGuard],
      },

      {
        path: 'ConsulteListeCandidatsQuiPostulesAUnePosteSpecifique/:id',
        component:
          ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent,
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
