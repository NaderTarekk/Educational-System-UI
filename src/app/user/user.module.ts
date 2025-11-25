import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './component/users/users.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserRoutingModule } from '../routing/user-routing.module';
import { ProfileComponent } from './component/profile/profile.component';
import { SharedModule } from "../shared/shared-module";
import { MatPaginatorModule } from '@angular/material/paginator';


@NgModule({
  declarations: [
    UsersComponent,
    ProfileComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    UserRoutingModule,
    FormsModule,
    SharedModule,
    MatPaginatorModule
]
})
export class UserModule { }
