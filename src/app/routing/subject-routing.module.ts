import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubjectsComponent } from '../subjects/components/subject/subject.component';

const routes: Routes = [
    { path: '', component: SubjectsComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SubjectRoutingModule { }