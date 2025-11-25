import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from "../shared/shared-module";
import { AuthRoutingModule } from '../routing/auth-routing.module';



@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    AuthRoutingModule
]
})
export class AuthModule { }
