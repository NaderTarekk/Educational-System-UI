import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamsComponent } from './components/exams/exams.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamRoutingModule } from '../routing/exam-routing.module';
import { ExamsListComponent } from './components/exams-list/exams-list.component';
import { TakeExamComponent } from './components/take-exam/take-exam.component';
import { ExamResultComponent } from './components/exam-result/exam-result.component';
import { ExamDetailsComponentComponent } from './components/exam-details-component/exam-details-component.component';
import { CreateEditExamComponent } from './components/create-edit-exam/create-edit-exam.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { SharedModule } from '../shared/shared-module';
import { MyExamsComponent } from './components/my-exams/my-exams.component';
import { FilterPipePipe } from '../pipes/filter-pipe.pipe';


@NgModule({
  declarations: [
    ExamsComponent,
    ExamsListComponent,
    TakeExamComponent,
    ExamResultComponent,
    ExamDetailsComponentComponent,
    CreateEditExamComponent,
    MyExamsComponent,
    FilterPipePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ExamRoutingModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule,
    SharedModule
  ]
})
export class ExamsModule { }
