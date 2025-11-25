import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendancesComponent } from '../attendaces/components/attendances/attendances.component';
import { GroupAttendanceReportComponent } from '../attendaces/components/group-attendance-report/group-attendance-report.component';
import { DailyAttendanceReportComponent } from '../attendaces/components/daily-attendance-report/daily-attendance-report.component';

const routes: Routes = [
    { path: '', component: AttendancesComponent },
    { path: 'group-attendance-report', component: GroupAttendanceReportComponent },
    { path: 'daily-attendance-report', component: DailyAttendanceReportComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AttendaceRoutingModule { }