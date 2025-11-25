import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './components/main-component/main-component';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class MainModule { }
