import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/components/main-component/main-component';
import { LoginComponent } from './auth/components/login/login';

const routes: Routes = [
  { path: "", component: MainComponent },
  {
    path: "auth", loadChildren: () =>
      import('./auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: "users", loadChildren: () =>
      import('./user/user.module').then(m => m.UserModule)
  },
  {
    path: "payments", loadChildren: () =>
      import('./payments/payments.module').then(m => m.PaymentsModule)
  },
  {
    path: "groups", loadChildren: () =>
      import('./groups/groups.module').then(m => m.GroupsModule)
  },
  {
    path: "expenses", loadChildren: () =>
      import('./expenses/expenses.module').then(m => m.ExpensesModule)
  },
  {
    path: "videos", loadChildren: () =>
      import('./videos/videos.module').then(m => m.VideosModule)
  },
  {
    path: "messages", loadChildren: () =>
      import('./messages/messages.module').then(m => m.MessagesModule)
  },
  {
    path: "settings", loadChildren: () =>
      import('./settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: "attendances", loadChildren: () =>
      import('./attendaces/attendaces.module').then(m => m.AttendacesModule)
  },
  {
    path: "exams", loadChildren: () =>
      import('./exams/exams.module').then(m => m.ExamsModule)
  },
  { path: "**", redirectTo: "", pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
