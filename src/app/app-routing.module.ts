import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { CallbackComponent } from './auth/callback/callback.component';
import { CompleteProfileComponent } from './auth/complete-profile/complete-profile.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ForgetPaswwordComponent } from './auth/forget-paswword/forget-paswword.component';
import { ResetPaswwordComponent } from './auth/reset-paswword/reset-paswword.component';
import { HomeComponent } from './auth/home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { UpdateProfilComponent } from './update-profil/update-profil.component';
const routes: Routes = [
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'forgot-password', component: ForgetPaswwordComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'reset-password', component: ResetPaswwordComponent },
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
  {
    path: 'rh',
    loadChildren: () => import('./rh/rh.module').then((m) => m.RHModule),
    canActivate: [AuthGuard],
    data: { roles: ['RH'] },
  },
  {
    path: 'manager',
    loadChildren: () =>
      import('./employee/employee.module').then((m) => m.EmployeeModule),
    canActivate: [AuthGuard],
    data: { roles: ['EMPLOYEE'] },
  },
  {
    path: 'candidat',
    loadChildren: () =>
      import('./candidat/candidat.module').then((m) => m.CandidatModule),
    canActivate: [AuthGuard],
    data: { roles: ['CANDIDAT'] },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
