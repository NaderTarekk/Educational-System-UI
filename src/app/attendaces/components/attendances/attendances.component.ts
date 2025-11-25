import { Component, OnInit } from '@angular/core';
import { AttendanceStatus, BulkAttendance } from '../../../models/attendance.model';
import { AttendancesService } from '../../services/attendances.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { ToastrService } from 'ngx-toastr';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

@Component({
  selector: 'app-attendances',
  standalone: false,
  templateUrl: './attendances.component.html',
  styleUrl: './attendances.component.scss'
})
export class AttendancesComponent implements OnInit {
  groups: any[] = [];
  students: Student[] = [];
  selectedGroupId: string = '';
  selectedDate: string = new Date().toISOString().split('T')[0];
  loading = false;
  searchTerm = '';
  showQuickMarkMenu = false;

  attendanceRecords: Map<string, AttendanceStatus> = new Map();

  AttendanceStatus = AttendanceStatus;

  stats = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  };

  statusOptions = [
    {
      value: AttendanceStatus.Present,
      label: 'حاضر',
      icon: 'fa-check',
      color: 'green',
      bgClass: 'bg-green-500',
      hoverClass: 'hover:bg-green-100',
      activeClass: 'bg-green-500 text-white ring-4 ring-green-200'
    },
    {
      value: AttendanceStatus.Absent,
      label: 'غائب',
      icon: 'fa-times',
      color: 'red',
      bgClass: 'bg-red-500',
      hoverClass: 'hover:bg-red-100',
      activeClass: 'bg-red-500 text-white ring-4 ring-red-200'
    },
    {
      value: AttendanceStatus.Late,
      label: 'متأخر',
      icon: 'fa-clock',
      color: 'orange',
      bgClass: 'bg-orange-500',
      hoverClass: 'hover:bg-orange-100',
      activeClass: 'bg-orange-500 text-white ring-4 ring-orange-200'
    }
  ];

  constructor(
    private attendanceService: AttendancesService,
    private groupsService: GroupsService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.groupsService.getAllGroups().subscribe({
      next: (response:any) => {
        if (response.success) {
          this.groups = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.toastr.error('حدث خطأ أثناء تحميل المجموعات');
        this.loading = false;
      }
    });
  }

  onGroupChange(): void {
    if (this.selectedGroupId) {
      this.loadStudents();
      this.loadExistingAttendance();
    } else {
      this.students = [];
      this.attendanceRecords.clear();
      this.calculateStats();
    }
  }

  onDateChange(): void {
    if (this.selectedGroupId) {
      this.loadExistingAttendance();
    }
  }

  loadStudents(): void {
    this.loading = true;
    this.groupsService.getStudentsByGroupId(this.selectedGroupId).subscribe({
      next: (response:any) => {
        if (response.success) {
          this.students = response.data.map((s: any) => ({
            ...s,
            fullName: `${s.firstName} ${s.lastName}`
          }));
          this.initializeAttendance();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.toastr.error('حدث خطأ أثناء تحميل الطلاب');
        this.loading = false;
      }
    });
  }

  loadExistingAttendance(): void {
    if (!this.selectedGroupId || !this.selectedDate) return;

    this.loading = true;
    this.attendanceService.getByGroupAndDate(this.selectedGroupId, this.selectedDate).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          this.attendanceRecords.clear();
          response.data.forEach((record: any) => {
            this.attendanceRecords.set(record.studentId, record.status);
          });
          this.toastr.success('تم تحميل سجلات الحضور المحفوظة');
        } else {
          this.initializeAttendance();
        }
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.initializeAttendance();
        this.loading = false;
      }
    });
  }

  initializeAttendance(): void {
    this.attendanceRecords.clear();
    this.students.forEach(student => {
      this.attendanceRecords.set(student.id, AttendanceStatus.Present);
    });
    this.calculateStats();
  }

  setStatus(studentId: string, status: AttendanceStatus): void {
    this.attendanceRecords.set(studentId, status);
    this.calculateStats();
  }

  getStatus(studentId: string): AttendanceStatus {
    return this.attendanceRecords.get(studentId) || AttendanceStatus.Present;
  }

  getStatusOption(status: AttendanceStatus) {
    return this.statusOptions.find(opt => opt.value === status);
  }

  markAll(status: AttendanceStatus): void {
    this.students.forEach(student => {
      this.attendanceRecords.set(student.id, status);
    });
    this.calculateStats();
    this.showQuickMarkMenu = false;

    const statusLabel = this.getStatusOption(status)?.label || '';
    this.toastr.info(`تم تحديد الكل كـ ${statusLabel}`);
  }

  calculateStats(): void {
    this.stats = {
      total: this.students.length,
      present: 0,
      absent: 0,
      late: 0
    };

    this.attendanceRecords.forEach(status => {
      if (status === AttendanceStatus.Present) this.stats.present++;
      if (status === AttendanceStatus.Absent) this.stats.absent++;
      if (status === AttendanceStatus.Late) this.stats.late++;
    });
  }

  saveAttendance(): void {
    if (!this.selectedGroupId || !this.selectedDate) {
      this.toastr.error('يرجى اختيار المجموعة والتاريخ');
      return;
    }

    if (this.students.length === 0) {
      this.toastr.error('لا يوجد طلاب في المجموعة');
      return;
    }

    const bulkData: BulkAttendance = {
      groupId: this.selectedGroupId,
      date: this.selectedDate,
      markedBy: localStorage.getItem('NHC_PL_UserId') || '',
      attendances: Array.from(this.attendanceRecords.entries()).map(([studentId, status]) => ({
        studentId,
        status
      }))
    };

    this.loading = true;
    this.attendanceService.createBulkAttendance(bulkData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success(response.message || 'تم حفظ الحضور بنجاح');
        } else {
          this.toastr.error(response.message);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving attendance:', error);
        this.toastr.error('حدث خطأ أثناء حفظ الحضور');
        this.loading = false;
      }
    });
  }

  get filteredStudents(): Student[] {
    if (!this.searchTerm) return this.students;

    const search = this.searchTerm.toLowerCase();
    return this.students.filter(s =>
      s.fullName.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search)
    );
  }

  getPercentage(value: number): number {
    return this.stats.total > 0 ? Math.round((value / this.stats.total) * 100) : 0;
  }

  getTodayFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSelectedGroupName(): string {
    const group = this.groups.find(g => g.id === this.selectedGroupId);
    return group ? group.name : '';
  }

}
