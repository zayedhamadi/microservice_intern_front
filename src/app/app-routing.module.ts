import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { CallbackComponent } from './auth/callback/callback.component';
import { CompleteProfileComponent } from './auth/complete-profile/complete-profile.component';

import { ForgetPaswwordComponent } from './auth/forget-paswword/forget-paswword.component';
import { ResetPaswwordComponent } from './auth/reset-paswword/reset-paswword.component';
import { HomeComponent } from './auth/home/home.component';

import { AuthGuard } from './core/guards/auth.guard';
import { profileCompleteGuard } from './core/guards/profile-complete.guard';


import { UpdateProfilComponent } from './communComponents/update-profil/update-profil.component';

import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from './communComponents/consulterlesliste-poste-par-employee-ou-candidat/consulterlesliste-poste-par-employee-ou-candidat.component';

import { ConsulterspecificposteseloncandidatandadminComponent } from './communComponents/consulterspecificposteseloncandidatandadmin/consulterspecificposteseloncandidatandadmin.component';
import { ProfileComponent } from './communComponents/profile/profile.component';

const routes: Routes = [
  // =========================
  // AUTHENTICATION
  // =========================

  {
    path: '',
    redirectTo: '/signin',
    pathMatch: 'full',
  },

  {
    path: 'signin',
    component: SigninComponent,
  },

  {
    path: 'signup',
    component: SignupComponent,
  },

  {
    path: 'callback',
    component: CallbackComponent,
  },

  {
    path: 'forgot-password',
    component: ForgetPaswwordComponent,
  },

  {
    path: 'reset-password',
    component: ResetPaswwordComponent,
  },

  // =========================
  // GENERAL
  // =========================

  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'complete-profile',
    component: CompleteProfileComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'updateMyProfil',
    component: UpdateProfilComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'getMyprofile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },

  // =========================
  // POSTS
  // =========================

  {
    path: 'consulterspecifiPosteDisponibles/:id',
    component: ConsulterspecificposteseloncandidatandadminComponent,
    canActivate: [AuthGuard, profileCompleteGuard],
  },

  {
    path: 'consulterlesPosteDisponibles',
    component: ConsulterleslistePosteParEmployeeOuCandidatComponent,
    canActivate: [AuthGuard, profileCompleteGuard],
  },

  // =========================
  // RH MODULE
  // =========================

  {
    path: 'rh',
    loadChildren: () => import('./rh/rh.module').then((m) => m.RHModule),
    canActivate: [AuthGuard],
    data: {
      roles: ['RH'],
    },
  },

  // =========================
  // EMPLOYEE MODULE
  // =========================

  {
    path: 'manager',
    loadChildren: () =>
      import('./employee/employee.module').then((m) => m.EmployeeModule),
    canActivate: [AuthGuard],
    data: {
      roles: ['EMPLOYEE'],
    },
  },

  // =========================
  // CANDIDAT MODULE
  // =========================

  {
    path: 'candidat',
    loadChildren: () =>
      import('./candidat/candidat.module').then((m) => m.CandidatModule),
    canActivate: [AuthGuard],
    data: {
      roles: ['CANDIDAT'],
    },
  },

  // =========================
  // UNKNOWN ROUTE
  // =========================

  {
    path: '**',
    redirectTo: '/signin',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
