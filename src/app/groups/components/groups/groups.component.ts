// groups.component.ts
import { Component, OnInit } from '@angular/core';
import { GroupsService } from '../../services/groups.service';
import { Group, Student } from '../../../models/group.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-groups',
  standalone: false,
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  filteredGroups: Group[] = [];
  groupStudents: Student[] = [];

  searchTerm = '';
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  loading = false;

  // Modals
  showAddModal = false;
  showEditModal = false;
  showStudentsModal = false;
  showDeleteModal = false;

  selectedGroup: Group | null = null;

  // ========== أيام الأسبوع ==========
  weekDays = [
    { value: 'Saturday', numValue: 6, label: 'السبت' },
    { value: 'Sunday', numValue: 0, label: 'الأحد' },
    { value: 'Monday', numValue: 1, label: 'الاثنين' },
    { value: 'Tuesday', numValue: 2, label: 'الثلاثاء' },
    { value: 'Wednesday', numValue: 3, label: 'الأربعاء' },
    { value: 'Thursday', numValue: 4, label: 'الخميس' },
    { value: 'Friday', numValue: 5, label: 'الجمعة' }
  ];

  // New group data
  newGroup: Group = {
    name: '',
    subject: '',
    instructorName: '',
    capacity: 0,
    feesPerLesson: 0,
    isActive: true,
    dayOfWeek: 6, // السبت كقيمة افتراضية
    startTime: '14:00', // 2 PM
    durationInHours: 2,
    location: ''
  };

  editGroupData: Group = {
    name: '',
    subject: '',
    instructorName: '',
    capacity: 0,
    feesPerLesson: 0,
    isActive: true,
    dayOfWeek: 6,
    startTime: '14:00',
    durationInHours: 2,
    location: ''
  };

  stats = [
    { label: 'إجمالي المجموعات', value: 0, color: 'bg-blue-100 text-blue-600' },
    { label: 'المجموعات النشطة', value: 0, color: 'bg-green-100 text-green-600' },
    { label: 'المجموعات غير النشطة', value: 0, color: 'bg-red-100 text-red-600' },
    { label: 'إجمالي الطلاب', value: 0, color: 'bg-purple-100 text-purple-600' }
  ];

  constructor(private groupsService: GroupsService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.groupsService.getAllGroups().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.groups = response.data.map(group => ({
            ...group,
            endTime: this.calculateEndTime(group.startTime, group.durationInHours)
          }));
          this.calculateCurrentStudents();
          this.filterGroups();
          this.updateStats();
        } else {
          this.showError(response.message || 'فشل في تحميل المجموعات');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.showError('حدث خطأ أثناء تحميل المجموعات');
        this.loading = false;
      }
    });
  }

  calculateCurrentStudents(): void {
    this.groups.forEach(group => {
      if (group.id) {
        this.groupsService.getStudentsByGroupId(group.id).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              group.currentStudents = response.data.length;
            }
          }
        });
      }
    });
  }

  updateStats(): void {
    const totalGroups = this.groups.length;
    const activeGroups = this.groups.filter(g => g.isActive).length;
    const inactiveGroups = this.groups.filter(g => !g.isActive).length;
    const totalStudents = this.groups.reduce((sum, g) => sum + (g.currentStudents || 0), 0);

    this.stats = [
      { label: 'إجمالي المجموعات', value: totalGroups, color: 'bg-blue-100 text-blue-600' },
      { label: 'المجموعات النشطة', value: activeGroups, color: 'bg-green-100 text-green-600' },
      { label: 'المجموعات غير النشطة', value: inactiveGroups, color: 'bg-red-100 text-red-600' },
      { label: 'إجمالي الطلاب', value: totalStudents, color: 'bg-purple-100 text-purple-600' }
    ];
  }

  filterGroups(): void {
    this.filteredGroups = this.groups.filter(group => {
      const matchesSearch = !this.searchTerm ||
        group.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        group.subject.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (group.instructorName && group.instructorName.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesStatus =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' && group.isActive) ||
        (this.selectedStatus === 'inactive' && !group.isActive);

      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterGroups();
  }

  selectStatus(status: 'all' | 'active' | 'inactive'): void {
    this.selectedStatus = status;
    this.filterGroups();
  }

  createGroup(): void {
    if (!this.newGroup.name?.trim() ||
      !this.newGroup.subject?.trim() ||
      this.newGroup.capacity == null ||
      this.newGroup.feesPerLesson == null ||
      this.newGroup.dayOfWeek == null ||
      !this.newGroup.startTime ||
      this.newGroup.durationInHours == null) {

      this.showError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (this.newGroup.startDate) {
      this.newGroup.startDate = new Date(this.newGroup.startDate).toISOString().split('T')[0];
    }

    // تحويل الوقت إلى TimeSpan format
    const groupToSend = {
      ...this.newGroup,
      startTime: this.newGroup.startTime + ':00' // "14:00" -> "14:00:00"
    };

    groupToSend.assistantId = "f569a3b4-38f3-4a2b-9115-0a2212adcce0";
    console.log("Sending group:", groupToSend);

    this.loading = true;

    this.groupsService.createNewGroup(groupToSend).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(response.message || 'تم إنشاء المجموعة بنجاح');
          this.closeAddModal();
          this.loadGroups();
        } else {
          console.log(response.message);
          
          this.showError(response.message || 'فشل في إنشاء المجموعة');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Create group error:', error);
        this.showError(error.error?.message || 'حدث خطأ أثناء إنشاء المجموعة');
        this.loading = false;
      }
    });
  }

  updateGroup(): void {
    if (!this.editGroupData.id) {
      this.showError('معرف المجموعة غير صحيح');
      return;
    }

    // تحويل الوقت إلى TimeSpan format
    const groupToUpdate = {
      ...this.editGroupData,
      startTime: this.editGroupData.startTime?.includes(':00:00')
        ? this.editGroupData.startTime
        : this.editGroupData.startTime + ':00'
    };

    this.loading = true;
    this.groupsService.updateGroup(groupToUpdate).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(response.message || 'تم تحديث المجموعة بنجاح');
          this.closeEditModal();
          this.loadGroups();
        } else {
          this.showError(response.message || 'فشل في تحديث المجموعة');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating group:', error);
        this.showError(error.error?.message || 'حدث خطأ أثناء تحديث المجموعة');
        this.loading = false;
      }
    });
  }

  deleteGroup(): void {
    if (!this.selectedGroup?.id) {
      this.showError('معرف المجموعة غير صحيح');
      return;
    }

    this.loading = true;
    this.groupsService.deleteGroup(this.selectedGroup.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(response.message || 'تم حذف المجموعة بنجاح');
          this.closeDeleteModal();
          this.loadGroups();
        } else {
          this.showError(response.message || 'فشل في حذف المجموعة');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting group:', error);
        this.showError('حدث خطأ أثناء حذف المجموعة');
        this.loading = false;
      }
    });
  }

  loadGroupStudents(groupId: string): void {
    this.loading = true;
    this.groupsService.getStudentsByGroupId(groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.groupStudents = response.data.map(student => ({
            ...student,
            fullName: `${student.firstName} ${student.lastName}`
          }));
        } else {
          this.groupStudents = [];
          this.showError(response.message || 'فشل في تحميل الطلاب');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.groupStudents = [];
        this.showError('حدث خطأ أثناء تحميل الطلاب');
        this.loading = false;
      }
    });
  }

  removeStudentFromGroup(studentId: string): void {
    if (!this.selectedGroup?.id) {
      this.showError('معرف المجموعة غير صحيح');
      return;
    }

    if (!confirm('هل أنت متأكد من إزالة هذا الطالب من المجموعة؟')) {
      return;
    }

    this.loading = true;
    this.groupsService.removeStudentFromGroup(this.selectedGroup.id, studentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(response.message || 'تم إزالة الطالب من المجموعة بنجاح');
          this.loadGroupStudents(this.selectedGroup!.id!);
          this.loadGroups();
        } else {
          this.showError(response.message || 'فشل في إزالة الطالب');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error removing student:', error);
        this.showError('حدث خطأ أثناء إزالة الطالب');
        this.loading = false;
      }
    });
  }

  // Modal handlers
  openAddModal(): void {
    this.newGroup = {
      name: '',
      subject: '',
      instructorName: '',
      capacity: 0,
      assistantId: "13978a26-b67d-4e16-8ad9-c7e6936a0256",
      feesPerLesson: 0,
      isActive: true,
      dayOfWeek: 6,
      startTime: '14:00',
      durationInHours: 2
    };
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddModal(): void {
    this.showAddModal = false;
    document.body.style.overflow = 'auto';
  }

  openEditModal(group: Group): void {
    this.editGroupData = {
      ...group,
      startTime: group.startTime?.substring(0, 5) // "14:00:00" -> "14:00"
    };
    this.showEditModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    document.body.style.overflow = 'auto';
  }

  openStudentsModal(group: Group): void {
    this.selectedGroup = group;
    this.showStudentsModal = true;
    if (group.id) {
      this.loadGroupStudents(group.id);
    }
    document.body.style.overflow = 'hidden';
  }

  closeStudentsModal(): void {
    this.showStudentsModal = false;
    this.selectedGroup = null;
    this.groupStudents = [];
    document.body.style.overflow = 'auto';
  }

  openDeleteModal(group: Group): void {
    this.selectedGroup = group;
    this.showDeleteModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedGroup = null;
    document.body.style.overflow = 'auto';
  }

  // groups.component.ts

  formatTime(time?: string): string {
    if (!time) return 'غير محدد';

    const cleanTime = time.toString().replace(/[{}]/g, '');
    const parts = cleanTime.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1];

    const period = hours >= 12 ? 'م' : 'ص';

    if (hours > 12) hours = hours - 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${period}`;
  }

  calculateEndTime(startTime?: string, duration?: number): string {
    if (!startTime || !duration) return 'غير محدد';

    const cleanTime = startTime.toString().replace(/[{}]/g, '');
    const parts = cleanTime.split(':');
    let hours = parseInt(parts[0]) + duration;
    const minutes = parts[1];

    if (hours >= 24) hours = hours - 24;

    const period = hours >= 12 ? 'م' : 'ص';

    if (hours > 12) hours = hours - 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${period}`;
  }
  getDayName(dayNumber?: number): string {
    if (dayNumber == null) return 'غير محدد';
    const day = this.weekDays.find(d => d.value === dayNumber.toString());
    return day ? day.label : 'غير محدد';
  }



  getScheduleText(group: Group): string {
    const day = this.getDayName(group.dayOfWeek);
    const start = this.formatTime(group.startTime);
    const end = group.endTime || this.calculateEndTime(group.startTime, group.durationInHours);

    return `${day} من ${start} إلى ${end}`;
  }

  // Utility functions
  getStatusBadgeColor(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'نشطة' : 'غير نشطة';
  }

  getCapacityPercentage(current: number = 0, capacity: number): number {
    if (capacity === 0) return 0;
    return Math.min((current / capacity) * 100, 100);
  }

  getCapacityColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  showSuccess(message: string): void {
    this.toastr.success(message);
  }

  showError(message: string): void {
    this.toastr.error(message);
  }
}