import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExamsListComponent } from '../exams/components/exams-list/exams-list.component';
import { TakeExamComponent } from '../exams/components/take-exam/take-exam.component';
import { MyExamsComponent } from '../exams/components/my-exams/my-exams.component';
import { ExamResultComponent } from '../exams/components/exam-result/exam-result.component';

const routes: Routes = [
    { path: '', component: ExamsListComponent },
    { path: 'take-exam', component: TakeExamComponent },
    {
        path: 'take/:id',
        component: TakeExamComponent,
        // canActivate: [AuthGuard],
        data: { roles: ['Student'] }
    },
    {
        path: 'result/:id',
        component: ExamResultComponent,
        // canActivate: [AuthGuard],
        data: { roles: ['Student', 'Admin', 'Assistant'] }
    },
    {
        path: 'my-exams',
        component: MyExamsComponent,
        // canActivate: [AuthGuard],
        data: { roles: ['Student'] }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExamRoutingModule { }