import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAttendanceReportComponent } from './group-attendance-report.component';

describe('GroupAttendanceReportComponent', () => {
  let component: GroupAttendanceReportComponent;
  let fixture: ComponentFixture<GroupAttendanceReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupAttendanceReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupAttendanceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
