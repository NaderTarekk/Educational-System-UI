import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from "../shared/shared-module";
import { AuthRoutingModule } from '../routing/auth-routing.module';
import { SignupComponent } from './components/signup/signup.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';



@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    FormsModule
]
})
export class AuthModule { }
