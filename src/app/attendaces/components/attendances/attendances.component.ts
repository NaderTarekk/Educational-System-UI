import { Component, OnInit, HostListener } from '@angular/core';
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

// نوع طريقة التسجيل
type AttendanceMode = 'barcode' | 'manual';

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

  // 🆕 متغيرات الباركود
  attendanceMode: AttendanceMode = 'barcode'; // الوضع الافتراضي
  showModeSelectionModal = true; // عرض المودال عند فتح الصفحة
  barcodeInput = '';
  lastScannedTime = 0;
  scannedStudents: Set<string> = new Set(); // لتتبع الطلاب الممسوحين
  barcodeTimeout: any;

  attendanceRecords: Map<string, AttendanceStatus> = new Map();

  AttendanceStatus = AttendanceStatus;

  stats = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    scanned: 0 // عدد الطلاب الممسوحين
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

  // 🆕 اختيار طريقة التسجيل
  selectMode(mode: AttendanceMode): void {
    this.attendanceMode = mode;
    this.showModeSelectionModal = false;

    if (mode === 'barcode') {
      this.toastr.info('جاهز لمسح الباركود - امسح بطاقة الطالب', '📷 وضع الباركود', {
        timeOut: 3000
      });
    } else {
      this.toastr.info('يمكنك الآن تسجيل الحضور يدوياً', '✋ وضع يدوي', {
        timeOut: 3000
      });
    }
  }

  // 🆕 تبديل الوضع
  toggleMode(): void {
    this.attendanceMode = this.attendanceMode === 'barcode' ? 'manual' : 'barcode';
    this.barcodeInput = '';
    this.scannedStudents.clear();

    if (this.attendanceMode === 'barcode') {
      this.toastr.info('تم التبديل إلى وضع الباركود', '📷 وضع الباركود');
    } else {
      this.toastr.info('تم التبديل إلى الوضع اليدوي', '✋ وضع يدوي');
    }
  }

  @HostListener('window:keypress', ['$event'])
  handleBarcodeInput(event: KeyboardEvent): void {
    if (this.attendanceMode !== 'barcode' || !this.selectedGroupId) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (event.key === 'Enter') {
      if (this.barcodeInput.length > 0) {
        this.processBarcode(this.barcodeInput.trim());
        this.barcodeInput = '';
      }
      event.preventDefault();
      return;
    }

    this.barcodeInput += event.key;

    if (this.barcodeTimeout) {
      clearTimeout(this.barcodeTimeout);
    }

    // ⚡ زود الوقت لـ 200ms بدل 100ms
    this.barcodeTimeout = setTimeout(() => {
      // إذا لم يضغط Enter، جرب المعالجة تلقائياً
      if (this.barcodeInput.length >= 8) { // ← أضف هذا الشرط
        this.processBarcode(this.barcodeInput.trim());
      }
      this.barcodeInput = '';
    }, 200); // ← غيرها من 100 لـ 200
  }

  // 🆕 معالجة الباركود الممسوح
  // 🆕 معالجة الباركود الممسوح
  processBarcode(barcode: string): void {
    
    console.log('🔍 Barcode scanned:', barcode);

    // تجنب المسح المتكرر السريع
    const now = Date.now();
    if (now - this.lastScannedTime < 1000) {
      console.log('⚠️ Too fast, ignoring...');
      return;
    }
    this.lastScannedTime = now;

    // ✅ البحث بطرق متعددة
    let student = this.students.find(s => {
      // 1. مطابقة مباشرة بالـ ID الكامل
      if (s.id === barcode) return true;

      // 2. مطابقة آخر 8 أرقام من الـ ID
      const studentShortId = s.id.replace(/\D/g, '').slice(-8).padStart(8, '0');
      if (studentShortId === barcode) return true;

      // 3. مطابقة الباركود بدون أي معالجة
      const cleanBarcode = barcode.replace(/\D/g, '');
      const cleanStudentId = s.id.replace(/\D/g, '');
      if (cleanStudentId.includes(cleanBarcode) || cleanBarcode.includes(cleanStudentId)) return true;

      return false;
    });

    if (!student) {
      console.error('❌ Student not found for barcode:', barcode);
      console.log('📋 Available student IDs:', this.students.map(s => ({
        id: s.id,
        shortId: s.id.replace(/\D/g, '').slice(-8).padStart(8, '0'),
        name: s.fullName
      })));

      this.toastr.error('الباركود غير مسجل في هذه المجموعة', '❌ طالب غير موجود');
      this.playErrorSound();
      return;
    }

    // تحقق إذا كان تم مسحه مسبقاً
    if (this.scannedStudents.has(student.id)) {
      this.toastr.warning(`${student.fullName} - تم المسح مسبقاً`, '⚠️ مسجل بالفعل');
      this.playWarningSound();
      return;
    }

    // تسجيل الحضور
    this.setStatus(student.id, AttendanceStatus.Present);
    this.scannedStudents.add(student.id);

    // تحديث الإحصائيات
    this.calculateStats();

    // إشعار نجاح
    this.toastr.success(`${student.fullName} - تم التسجيل`, '✅ حاضر');
    this.playSuccessSound();

    // تمييز الطالب في القائمة
    this.highlightStudent(student.id);
  }

  // 🆕 تمييز الطالب الممسوح
  highlightStudent(studentId: string): void {
    setTimeout(() => {
      const element = document.getElementById(`student-${studentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-flash');
        setTimeout(() => {
          element.classList.remove('highlight-flash');
        }, 2000);
      }
    }, 100);
  }

  // 🆕 الأصوات
  playSuccessSound(): void {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgoSGiImKi4yMjY2Oj4+QkZGSkpOTk5SVlZWWlpeXl5iYmZmZmpqam5ubnJycnZ2dnp6en5+fn6CgoKCgoaGhoaGhoaGhoaGhoaGhoaGhoKCgoJ+fn56enp2dnJubmpqZmJiXlpWVlJOSkZCPjo2MioiFgoB+fHp4dnRycG5sa2lnZWNhX11bWVdVU1FPTUtJR0VDQkA+PDs5Nw==';
    audio.play().catch(() => { });
  }

  playErrorSound(): void {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/fw==';
    audio.play().catch(() => { });
  }

  playWarningSound(): void {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgoSGh4mKi4yNjo+QkJGSk5SVlZaXmJmanJydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKA==';
    audio.play().catch(() => { });
  }

  // الدوال الأصلية
  loadGroups(): void {
    this.loading = true;
    this.groupsService.getAllGroups().subscribe({
      next: (response: any) => {
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
      this.scannedStudents.clear(); // إعادة تعيين المسح
    } else {
      this.students = [];
      this.attendanceRecords.clear();
      this.scannedStudents.clear();
      this.calculateStats();
    }
  }

  onDateChange(): void {
    if (this.selectedGroupId) {
      this.loadExistingAttendance();
      this.scannedStudents.clear();
    }
  }

  loadStudents(): void {
    this.loading = true;
    this.groupsService.getStudentsByGroupId(this.selectedGroupId).subscribe({
      next: (response: any) => {
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
          this.scannedStudents.clear();
          response.data.forEach((record: any) => {
            this.attendanceRecords.set(record.studentId, record.status);
            if (record.status === AttendanceStatus.Present) {
              this.scannedStudents.add(record.studentId);
            }
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
      this.attendanceRecords.set(student.id, AttendanceStatus.Absent);
    });
    this.calculateStats();
  }

  setStatus(studentId: string, status: AttendanceStatus): void {
    this.attendanceRecords.set(studentId, status);
    this.calculateStats();
  }

  getStatus(studentId: string): AttendanceStatus {
    return this.attendanceRecords.get(studentId) || AttendanceStatus.Absent;
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
      late: 0,
      scanned: this.scannedStudents.size
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
          this.toastr.success(response.message || 'تم حفظ الحضور بنجاح', '✅ تم الحفظ');
          this.scannedStudents.clear();
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
      s.email.toLowerCase().includes(search) ||
      s.id.toLowerCase().includes(search)
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

  // 🆕 التحقق إذا كان الطالب ممسوح
  isScanned(studentId: string): boolean {
    return this.scannedStudents.has(studentId);
  }
}