import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendancesComponent } from './components/attendances/attendances.component';
import { AttendaceRoutingModule } from '../routing/attendance-routing.module';
import { FormsModule } from '@angular/forms';
import { GroupAttendanceReportComponent } from './components/group-attendance-report/group-attendance-report.component';
import { DailyAttendanceReportComponent } from './components/daily-attendance-report/daily-attendance-report.component';



@NgModule({
  declarations: [
    AttendancesComponent,
    GroupAttendanceReportComponent,
    DailyAttendanceReportComponent
  ],
  imports: [
    CommonModule,
    AttendaceRoutingModule,
    FormsModule
  ]
})
export class AttendacesModule { }
