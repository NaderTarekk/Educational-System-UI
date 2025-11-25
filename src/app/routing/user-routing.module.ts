import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersComponent } from '../user/component/users/users.component';
import { ProfileComponent } from '../user/component/profile/profile.component';

const routes: Routes = [
  { path: '', component: UsersComponent },
  { path: 'profile', component: ProfileComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}
