import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectsComponent } from './components/subject/subject.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SubjectRoutingModule } from '../routing/subject-routing.module';



@NgModule({
  declarations: [
    SubjectsComponent
  ],
  imports: [
    CommonModule,
    SubjectRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SubjectsModule { }
