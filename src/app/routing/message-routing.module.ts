import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupsComponent } from '../groups/components/groups/groups.component';
import { MessagesComponent } from '../messages/components/messages/messages.component';

const routes: Routes = [
  { path: '', component: MessagesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MessageRoutingModule {}
