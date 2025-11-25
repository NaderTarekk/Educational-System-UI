// group-attendance-report.component.ts
import { Component, OnInit } from '@angular/core';
import { AttendanceStatus, StudentAttendanceSummary } from '../../../models/attendance.model';
import { AttendancesService } from '../../services/attendances.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-group-attendance-report',
  standalone: false,
  templateUrl: './group-attendance-report.component.html',
  styleUrl: './group-attendance-report.component.scss'
})
export class GroupAttendanceReportComponent implements OnInit {
  groups: any[] = [];
  selectedGroupId: string = '';
  selectedGroup: any = null;
  startDate: string = '';
  endDate: string = '';
  loading = false;
  searchTerm = '';

  studentsSummary: StudentAttendanceSummary[] = [];
  allRecords: any[] = [];

  overallStats = {
    totalStudents: 0,
    totalDays: 0,
    averageAttendanceRate: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0
  };

  viewMode: 'summary' | 'detailed' = 'summary';
  selectedStudent: StudentAttendanceSummary | null = null;

  AttendanceStatus = AttendanceStatus;

  constructor(
    private attendanceService: AttendancesService,
    private groupsService: GroupsService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.initializeDates();
    this.loadGroups();
  }

  initializeDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
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
    } else {
      this.selectedGroup = null;
    }
  }

  generateReport(): void {
    if (!this.selectedGroupId) {
      this.toastr.warning('يرجى اختيار المجموعة');
      return;
    }

    if (!this.startDate || !this.endDate) {
      this.toastr.warning('يرجى اختيار التواريخ');
      return;
    }

    this.loading = true;

    this.groupsService.getStudentsByGroupId(this.selectedGroupId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const students = response.data;
          this.loadAttendanceForAllStudents(students);
        } else {
          this.loading = false;
          this.toastr.error('لا يوجد طلاب في هذه المجموعة');
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.toastr.error('حدث خطأ أثناء تحميل الطلاب');
        this.loading = false;
      }
    });
  }

  loadAttendanceForAllStudents(students: any[]): void {
    this.studentsSummary = [];
    let completedRequests = 0;

    students.forEach(student => {
      this.attendanceService.getByStudent(
        student.id,
        this.selectedGroupId,
        this.startDate,
        this.endDate
      ).subscribe({
        next: (response) => {
          const records = response.success && response.data ? response.data : [];

          const processedRecords = records.map(record => ({
            ...record,
            status: this.convertStatus(record.status)
          }));

          const summary: StudentAttendanceSummary = {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            email: student.email,
            totalDays: processedRecords.length,
            presentDays: processedRecords.filter(r => r.status === 0).length,
            absentDays: processedRecords.filter(r => r.status === 1).length,
            lateDays: processedRecords.filter(r => r.status === 2).length,
            attendanceRate: 0,
            records: processedRecords
          };

          summary.attendanceRate = summary.totalDays > 0
            ? Math.round((summary.presentDays / summary.totalDays) * 100)
            : 0;

          this.studentsSummary.push(summary);

          completedRequests++;
          if (completedRequests === students.length) {
            this.calculateOverallStats();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading attendance for student:', student.id, error);
          completedRequests++;
          if (completedRequests === students.length) {
            this.calculateOverallStats();
            this.loading = false;
          }
        }
      });
    });
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

  calculateOverallStats(): void {
    this.overallStats.totalStudents = this.studentsSummary.length;

    if (this.studentsSummary.length === 0) {
      this.overallStats = {
        totalStudents: 0,
        totalDays: 0,
        averageAttendanceRate: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0
      };
      return;
    }

    const allDates = new Set<string>();
    this.studentsSummary.forEach(s => {
      s.records.forEach(r => allDates.add(r.date));
    });
    this.overallStats.totalDays = allDates.size;

    this.overallStats.totalPresent = this.studentsSummary.reduce((sum, s) => sum + s.presentDays, 0);
    this.overallStats.totalAbsent = this.studentsSummary.reduce((sum, s) => sum + s.absentDays, 0);
    this.overallStats.totalLate = this.studentsSummary.reduce((sum, s) => sum + s.lateDays, 0);

    const totalRate = this.studentsSummary.reduce((sum, s) => sum + s.attendanceRate, 0);
    this.overallStats.averageAttendanceRate = Math.round(totalRate / this.studentsSummary.length);
  }

  get filteredStudents(): StudentAttendanceSummary[] {
    if (!this.searchTerm) return this.studentsSummary;

    const search = this.searchTerm.toLowerCase();
    return this.studentsSummary.filter(s =>
      s.studentName.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search)
    );
  }

  viewStudentDetails(student: StudentAttendanceSummary): void {
    this.selectedStudent = student;
    this.viewMode = 'detailed';
  }

  backToSummary(): void {
    this.viewMode = 'summary';
    this.selectedStudent = null;
  }

  getAttendanceRateClass(rate: number): string {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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

  // ✅ Export to Excel
  exportToExcel(): void {
    if (this.studentsSummary.length === 0) {
      this.toastr.warning('لا توجد بيانات للتصدير');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ['تقرير حضور المجموعة'],
        [],
        ['المجموعة:', this.selectedGroup?.name || ''],
        ['المادة:', this.selectedGroup?.subject || ''],
        ['المدرس:', this.selectedGroup?.instructorName || ''],
        ['من تاريخ:', this.startDate],
        ['إلى تاريخ:', this.endDate],
        ['تاريخ التقرير:', new Date().toLocaleDateString('ar-EG')],
        [],
        ['الإحصائيات العامة'],
        ['إجمالي الطلاب', this.overallStats.totalStudents],
        ['أيام الحضور', this.overallStats.totalDays],
        ['متوسط نسبة الحضور', this.overallStats.averageAttendanceRate + '%'],
        ['إجمالي الحضور', this.overallStats.totalPresent],
        ['إجمالي الغياب', this.overallStats.totalAbsent],
        ['إجمالي التأخير', this.overallStats.totalLate],
        [],
        ['ملخص حضور الطلاب'],
        ['اسم الطالب', 'البريد الإلكتروني', 'إجمالي الأيام', 'حاضر', 'غائب', 'متأخر', 'نسبة الحضور'],
        ...this.studentsSummary.map(s => [
          s.studentName,
          s.email,
          s.totalDays,
          s.presentDays,
          s.absentDays,
          s.lateDays,
          s.attendanceRate + '%'
        ])
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

      wsSummary['!cols'] = [
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص التقرير');

      const detailedData: any[] = [
        ['السجلات التفصيلية'],
        [],
        ['اسم الطالب', 'البريد الإلكتروني', 'التاريخ', 'الحالة']
      ];

      this.studentsSummary.forEach(student => {
        student.records.forEach((record: any) => {
          const statusLabel = this.getStatusBadge(record.status).label;
          detailedData.push([
            student.studentName,
            student.email,
            new Date(record.date).toLocaleDateString('ar-EG'),
            statusLabel
          ]);
        });
      });

      const wsDetailed = XLSX.utils.aoa_to_sheet(detailedData);

      wsDetailed['!cols'] = [
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, wsDetailed, 'السجلات التفصيلية');

      const fileName = `تقرير_حضور_${this.selectedGroup?.name || 'المجموعة'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);

      this.toastr.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.toastr.error('حدث خطأ أثناء تصدير التقرير');
    }
  }

  // ✅ Export to PDF - using HTML to PDF
  async exportToPDF(): Promise<void> {
    if (this.studentsSummary.length === 0) {
      this.toastr.warning('لا توجد بيانات للتصدير');
      return;
    }

    try {
      this.loading = true;

      // إنشاء عنصر مؤقت للـ PDF
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm'; // A4 width
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.direction = 'rtl';
      pdfContent.style.backgroundColor = 'white';

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; font-size: 28px; margin-bottom: 10px;">تقرير حضور المجموعة</h1>
          <div style="width: 100%; height: 3px; background: linear-gradient(to right, #4F46E5, #7C3AED); margin: 10px 0;"></div>
        </div>

        <div style="background: #F3F4F6; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #E0E7FF;">المجموعة:</td>
              <td style="padding: 8px;">${this.selectedGroup?.name || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #E0E7FF;">المادة:</td>
              <td style="padding: 8px;">${this.selectedGroup?.subject || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #E0E7FF;">المدرس:</td>
              <td style="padding: 8px;">${this.selectedGroup?.instructorName || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #E0E7FF;">الفترة:</td>
              <td style="padding: 8px;">من ${this.startDate} إلى ${this.endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #E0E7FF;">تاريخ التقرير:</td>
              <td style="padding: 8px;">${new Date().toLocaleDateString('ar-EG')}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #7C3AED; font-size: 20px; margin-bottom: 15px;">الإحصائيات العامة</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: center;">
            <thead>
              <tr style="background: #4F46E5; color: white;">
                <th style="padding: 12px; border: 1px solid #CBD5E1;">المقياس</th>
                <th style="padding: 12px; border: 1px solid #CBD5E1;">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #FFFFFF;">
                <td style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">إجمالي الطلاب</td>
                <td style="padding: 10px; border: 1px solid #CBD5E1; font-weight: bold;">${this.overallStats.totalStudents}</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">أيام الحضور</td>
                <td style="padding: 10px; border: 1px solid #CBD5E1; font-weight: bold;">${this.overallStats.totalDays}</td>
              </tr>
              <tr style="background: #FFFFFF;">
                <td style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">متوسط نسبة الحضور</td>
                <td style="padding: 10px; border: 1px solid #CBD5E1; font-weight: bold; color: #047857;">${this.overallStats.averageAttendanceRate}%</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">إجمالي الحضور</td>
                <td style="padding: 10px; border: 1px solid #CBD5E1; font-weight: bold; color: #047857;">${this.overallStats.totalPresent}</td>
              </tr>
              <tr style="background: #FFFFFF;">
                <td style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">إجمالي الغياب</td>
                <td style="padding: 10px; border: 1px solid #CBD5E1; font-weight: bold; color: #DC2626;">${this.overallStats.totalAbsent}</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">إجمالي التأخير</td>
                <td style="padding: 10px; border: 1px solid #CBD5E1; font-weight: bold; color: #EA580C;">${this.overallStats.totalLate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always;">
          <h2 style="color: #7C3AED; font-size: 20px; margin-bottom: 15px;">ملخص حضور الطلاب</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px;">
            <thead>
              <tr style="background: #4F46E5; color: white;">
                <th style="padding: 10px; border: 1px solid #E5E7EB;">اسم الطالب</th>
                <th style="padding: 10px; border: 1px solid #E5E7EB;">البريد</th>
                <th style="padding: 10px; border: 1px solid #E5E7EB;">الأيام</th>
                <th style="padding: 10px; border: 1px solid #E5E7EB;">حاضر</th>
                <th style="padding: 10px; border: 1px solid #E5E7EB;">غائب</th>
                <th style="padding: 10px; border: 1px solid #E5E7EB;">متأخر</th>
                <th style="padding: 10px; border: 1px solid #E5E7EB;">النسبة</th>
              </tr>
            </thead>
            <tbody>
              ${this.studentsSummary.map((s, index) => {
        const rate = s.attendanceRate;
        let rateBg = '#FFFFFF';
        let rateColor = '#000000';

        if (rate >= 90) {
          rateBg = '#D1FAE5';
          rateColor = '#047857';
        } else if (rate >= 70) {
          rateBg = '#FED7AA';
          rateColor = '#EA580C';
        } else {
          rateBg = '#FEE2E2';
          rateColor = '#DC2626';
        }

        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';

        return `
                  <tr style="background: ${rowBg};">
                    <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right;">${s.studentName}</td>
                    <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right; font-size: 9px;">${s.email}</td>
                    <td style="padding: 8px; border: 1px solid #E5E7EB;">${s.totalDays}</td>
                    <td style="padding: 8px; border: 1px solid #E5E7EB; background: #D1FAE5; color: #047857; font-weight: bold;">${s.presentDays}</td>
                    <td style="padding: 8px; border: 1px solid #E5E7EB; background: #FEE2E2; color: #DC2626; font-weight: bold;">${s.absentDays}</td>
                    <td style="padding: 8px; border: 1px solid #E5E7EB; background: #FED7AA; color: #EA580C; font-weight: bold;">${s.lateDays}</td>
                    <td style="padding: 8px; border: 1px solid #E5E7EB; background: ${rateBg}; color: ${rateColor}; font-weight: bold;">${s.attendanceRate}%</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.body.appendChild(pdfContent);

      // تحويل HTML إلى Canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(pdfContent);

      // إنشاء PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      const fileName = `تقرير_حضور_${this.selectedGroup?.name || 'المجموعة'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      this.loading = false;
      this.toastr.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.loading = false;
      this.toastr.error('حدث خطأ أثناء تصدير التقرير');
    }
  }

  printReport(): void {
    window.print();
  }

  resetReport(): void {
    this.selectedGroupId = '';
    this.selectedGroup = null;
    this.studentsSummary = [];
    this.viewMode = 'summary';
    this.selectedStudent = null;
    this.initializeDates();
  }
}