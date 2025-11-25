import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidenav } from './components/sidenav/sidenav';
import { Navbar } from './components/navbar/navbar';
import { LoaderComponent } from './components/loader-component/loader-component';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';

@NgModule({
  declarations: [
    Sidenav,
    Navbar,
    LoaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatPaginatorModule,
],
  exports: [
    Sidenav,
    Navbar,
    LoaderComponent
  ]
})
export class SharedModule { }
