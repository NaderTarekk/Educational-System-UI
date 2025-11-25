import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExamsListComponent } from '../exams/components/exams-list/exams-list.component';

const routes: Routes = [
    { path: '', component: ExamsListComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExamRoutingModule { }