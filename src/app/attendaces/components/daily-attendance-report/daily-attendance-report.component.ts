// daily-attendance-report.component.ts
import { Component, OnInit } from '@angular/core';
import { AttendanceStatus } from '../../../models/attendance.model';
import { AttendancesService } from '../../services/attendances.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DayAttendance {
  date: string;
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  hasRecords: boolean;
}

interface DayDetails {
  date: string;
  group: any;
  records: any[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    presentPercentage: number;
    absentPercentage: number;
    latePercentage: number;
  };
}

@Component({
  selector: 'app-daily-attendance-report',
  standalone: false,
  templateUrl: './daily-attendance-report.component.html',
  styleUrl: './daily-attendance-report.component.scss'
})
export class DailyAttendanceReportComponent implements OnInit {
  groups: any[] = [];
  selectedGroupId: string = '';
  selectedGroup: any = null;
  loading = false;

  currentMonth: Date = new Date();
  calendarDays: DayAttendance[] = [];
  weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  selectedDay: DayDetails | null = null;
  showDayDetails = false;

  monthAttendanceData: Map<string, any[]> = new Map();

  AttendanceStatus = AttendanceStatus;

  constructor(
    private attendanceService: AttendancesService,
    private groupsService: GroupsService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadGroups();
    this.generateCalendar();
  }

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
      this.selectedGroup = this.groups.find(g => g.id === this.selectedGroupId);
      this.loadMonthData();
    } else {
      this.selectedGroup = null;
      this.monthAttendanceData.clear();
      this.generateCalendar();
    }
  }

  loadMonthData(): void {
    if (!this.selectedGroupId) return;

    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    this.loading = true;
    this.monthAttendanceData.clear();

    this.loadAllAttendanceForMonth(startDate, endDate);
  }

  loadAllAttendanceForMonth(startDate: string, endDate: string): void {
    this.groupsService.getStudentsByGroupId(this.selectedGroupId).subscribe({
      next: (studentsResponse: any) => {
        if (studentsResponse.success && studentsResponse.data && studentsResponse.data.length > 0) {
          const students = studentsResponse.data;

          const attendanceRequests = students.map((student: any) =>
            this.attendanceService.getByStudent(
              student.id,
              this.selectedGroupId,
              startDate,
              endDate
            ).toPromise()
          );

          Promise.all(attendanceRequests)
            .then(responses => {
              responses.forEach((response: any, index: number) => {
                const student = students[index];

                if (response?.success && response.data) {
                  response.data.forEach((record: any) => {
                    const recordDate = new Date(record.date);
                    const dateKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;

                    if (!this.monthAttendanceData.has(dateKey)) {
                      this.monthAttendanceData.set(dateKey, []);
                    }

                    this.monthAttendanceData.get(dateKey)!.push({
                      ...record,
                      studentId: student.id,
                      studentName: `${student.firstName} ${student.lastName}`,
                      studentEmail: student.email,
                      status: this.convertStatus(record.status)
                    });
                  });
                }
              });

              this.processCalendarData();
              this.loading = false;
            })
            .catch(error => {
              console.error('❌ Error loading attendance:', error);
              this.toastr.error('حدث خطأ أثناء تحميل البيانات');
              this.generateCalendar();
              this.loading = false;
            });
        } else {
          this.generateCalendar();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading students:', error);
        this.toastr.error('حدث خطأ أثناء تحميل الطلاب');
        this.generateCalendar();
        this.loading = false;
      }
    });
  }

  processCalendarData(): void {

    this.calendarDays = [];

    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      this.calendarDays.push({
        date: '',
        totalRecords: 0,
        present: 0,
        absent: 0,
        late: 0,
        hasRecords: false
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const records = this.monthAttendanceData.get(dateKey) || [];

      const present = records.filter(r => r.status === 0).length;
      const absent = records.filter(r => r.status === 1).length;
      const late = records.filter(r => r.status === 2).length;

      this.calendarDays.push({
        date: dateKey,
        totalRecords: records.length,
        present,
        absent,
        late,
        hasRecords: records.length > 0
      });
    }

  }

  generateCalendar(): void {
    this.calendarDays = [];

    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      this.calendarDays.push({
        date: '',
        totalRecords: 0,
        present: 0,
        absent: 0,
        late: 0,
        hasRecords: false
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      this.calendarDays.push({
        date: dateKey,
        totalRecords: 0,
        present: 0,
        absent: 0,
        late: 0,
        hasRecords: false
      });
    }
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    if (this.selectedGroupId) {
      this.loadMonthData();
    } else {
      this.generateCalendar();
    }
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    if (this.selectedGroupId) {
      this.loadMonthData();
    } else {
      this.generateCalendar();
    }
  }

  selectDay(day: DayAttendance): void {
    if (!day.date || !day.hasRecords) {
      return;
    }

    const records = this.monthAttendanceData.get(day.date) || [];

    if (records.length === 0) {
      this.toastr.warning('لا توجد بيانات لهذا اليوم');
      return;
    }

    const total = records.length;
    const present = records.filter(r => r.status === 0).length;
    const absent = records.filter(r => r.status === 1).length;
    const late = records.filter(r => r.status === 2).length;

    this.selectedDay = {
      date: day.date,
      group: this.selectedGroup,
      records: records,
      stats: {
        total,
        present,
        absent,
        late,
        presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
        absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
        latePercentage: total > 0 ? Math.round((late / total) * 100) : 0
      }
    };

    this.showDayDetails = true;
  }

  closeDayDetails(): void {
    this.showDayDetails = false;
    this.selectedDay = null;
  }

  convertStatus(status: any): number {
    if (typeof status === 'number') return status;
    if (typeof status === 'string') {
      const statusMap: { [key: string]: number } = {
        'Present': 0,
        'Absent': 1,
        'Late': 2
      };
      return statusMap[status] ?? 0;
    }
    return 0;
  }

  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }

  getDayNumber(day: DayAttendance): number {
    if (!day.date) return 0;
    const parts = day.date.split('-');
    return parseInt(parts[2], 10);
  }

  isToday(day: DayAttendance): boolean {
    if (!day.date) return false;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return day.date === todayKey;
  }

  getStatusBadge(status: number): { label: string, class: string, icon: string } {
    switch (status) {
      case 0:
        return { label: 'حاضر', class: 'bg-green-500', icon: 'fa-check' };
      case 1:
        return { label: 'غائب', class: 'bg-red-500', icon: 'fa-times' };
      case 2:
        return { label: 'متأخر', class: 'bg-orange-500', icon: 'fa-clock' };
      default:
        return { label: 'غير محدد', class: 'bg-gray-500', icon: 'fa-question' };
    }
  }

  // ✅ Export Day to PDF
  async exportDayToPDF(): Promise<void> {
    if (!this.selectedDay) {
      this.toastr.warning('لا توجد بيانات للتصدير');
      return;
    }

    try {
      this.loading = true;

      const formattedDate = new Date(this.selectedDay.date).toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm';
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.direction = 'rtl';
      pdfContent.style.backgroundColor = 'white';

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; font-size: 28px; margin-bottom: 10px;">تقرير الحضور اليومي</h1>
          <div style="width: 100%; height: 3px; background: linear-gradient(to right, #3B82F6, #06B6D4); margin: 10px 0;"></div>
        </div>

        <div style="background: #F3F4F6; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #DBEAFE;">التاريخ:</td>
              <td style="padding: 8px;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #DBEAFE;">المجموعة:</td>
              <td style="padding: 8px;">${this.selectedDay.group.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #DBEAFE;">المادة:</td>
              <td style="padding: 8px;">${this.selectedDay.group.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #DBEAFE;">المدرس:</td>
              <td style="padding: 8px;">${this.selectedDay.group.instructorName || 'غير محدد'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #0891B2; font-size: 20px; margin-bottom: 15px;">الإحصائيات</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="text-align: center; padding: 15px; background: #EFF6FF; border-radius: 10px;">
              <p style="font-size: 32px; font-weight: bold; color: #3B82F6; margin: 0;">${this.selectedDay.stats.total}</p>
              <p style="font-size: 12px; color: #6B7280; margin: 5px 0 0 0;">إجمالي الطلاب</p>
            </div>
            <div style="text-align: center; padding: 15px; background: #D1FAE5; border-radius: 10px;">
              <p style="font-size: 32px; font-weight: bold; color: #047857; margin: 0;">${this.selectedDay.stats.present}</p>
              <p style="font-size: 12px; color: #6B7280; margin: 5px 0 0 0;">حاضر (${this.selectedDay.stats.presentPercentage}%)</p>
            </div>
            <div style="text-align: center; padding: 15px; background: #FEE2E2; border-radius: 10px;">
              <p style="font-size: 32px; font-weight: bold; color: #DC2626; margin: 0;">${this.selectedDay.stats.absent}</p>
              <p style="font-size: 12px; color: #6B7280; margin: 5px 0 0 0;">غائب (${this.selectedDay.stats.absentPercentage}%)</p>
            </div>
            <div style="text-align: center; padding: 15px; background: #FED7AA; border-radius: 10px;">
              <p style="font-size: 32px; font-weight: bold; color: #EA580C; margin: 0;">${this.selectedDay.stats.late}</p>
              <p style="font-size: 12px; color: #6B7280; margin: 5px 0 0 0;">متأخر (${this.selectedDay.stats.latePercentage}%)</p>
            </div>
          </div>
        </div>

        <div>
          <h2 style="color: #0891B2; font-size: 20px; margin-bottom: 15px;">قائمة الطلاب</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: center;">
            <thead>
              <tr style="background: #3B82F6; color: white;">
                <th style="padding: 12px; border: 1px solid #CBD5E1;">اسم الطالب</th>
                <th style="padding: 12px; border: 1px solid #CBD5E1;">البريد الإلكتروني</th>
                <th style="padding: 12px; border: 1px solid #CBD5E1;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${this.selectedDay.records.map((record, index) => {
        const statusBadge = this.getStatusBadge(record.status);
        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
        let statusBg = '#FFFFFF';
        let statusColor = '#000000';

        if (record.status === 0) {
          statusBg = '#D1FAE5';
          statusColor = '#047857';
        } else if (record.status === 1) {
          statusBg = '#FEE2E2';
          statusColor = '#DC2626';
        } else if (record.status === 2) {
          statusBg = '#FED7AA';
          statusColor = '#EA580C';
        }

        return `
                  <tr style="background: ${rowBg};">
                    <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${record.studentName || 'غير معروف'}</td>
                    <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right; font-size: 11px;">${record.studentEmail || ''}</td>
                    <td style="padding: 10px; border: 1px solid #E5E7EB; background: ${statusBg}; color: ${statusColor}; font-weight: bold;">${statusBadge.label}</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #9CA3AF;">
          <p>تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      `;

      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `تقرير_الحضور_${this.selectedDay.date}_${this.selectedDay.group.name}.pdf`;
      pdf.save(fileName);

      this.loading = false;
      this.toastr.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.loading = false;
      this.toastr.error('حدث خطأ أثناء تصدير التقرير');
    }
  }

  printDay(): void {
    this.exportDayToPDF();
  }
}