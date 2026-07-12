import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule, DatePipe } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CallbackComponent } from './auth/callback/callback.component';
import { ResetPaswwordComponent } from './auth/reset-paswword/reset-paswword.component';
import { ForgetPaswwordComponent } from './auth/forget-paswword/forget-paswword.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { CompleteProfileComponent } from './auth/complete-profile/complete-profile.component';
import { ValidationSignUpComponent } from './auth/validation-sign-up/validation-sign-up.component';
import { JwtInterceptor } from './core/interceptor/jwt.interceptor';
import { HomeComponent } from './auth/home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ProfileComponent } from './profile/profile.component';
import { UpdateProfilComponent } from './update-profil/update-profil.component';
import { SafeUrlPipe } from './core/service/SafeUrlPipe';
@NgModule({
  declarations: [
    AppComponent,
    CallbackComponent,
    ResetPaswwordComponent,
    ForgetPaswwordComponent,
    SigninComponent,
    SignupComponent,
    CompleteProfileComponent,
    ValidationSignUpComponent,
    HomeComponent,
    NavbarComponent,
    ProfileComponent,
 SafeUrlPipe ,
    UpdateProfilComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    CommonModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
  
  ],
  providers: [
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
