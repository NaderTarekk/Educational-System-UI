import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupsComponent } from './components/groups/groups.component';
import { GroupRoutingModule } from '../routing/group-routing.module';
import { FormsModule } from '@angular/forms';
import { SharedModule } from "../shared/shared-module";



@NgModule({
  declarations: [
    GroupsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    GroupRoutingModule,
    SharedModule
]
})
export class GroupsModule { }
