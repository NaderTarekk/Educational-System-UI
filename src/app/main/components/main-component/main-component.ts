import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../../../user/services/users.service';
import { MessagesService } from '../../../messages/services/messages.service';
import { ReportsService, DashboardStatistics, StudentDashboard } from '../../services/reports.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-main-component',
  standalone: false,
  templateUrl: './main-component.html',
  styleUrl: './main-component.scss',
})
export class MainComponent implements OnInit {
  user: any = null;
  isLoading = true;
  messages: any[] = [];
  isAdmin = false;
  isStudent = false;
  adminStats: DashboardStatistics | null = null;
  monthlyRevenue: any[] = [];
  studentStats: StudentDashboard | null = null;
  isExporting = false; // ✅ Add loading state

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private userService: UsersService,
    private messageService: MessagesService,
    private reportsService: ReportsService
  ) { }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.isLoading = true;
    this.userService.getUserById('0').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.user = res.data;
          this.checkUserRole();

          if (this.isAdmin) {
            this.loadAdminDashboard();
          } else if (this.isStudent) {
            this.loadStudentDashboard();
          }

          this.loadMessages();
        } else {
          this.toastr.error('فشل تحميل البيانات', 'خطأ');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading user:', err);
        this.toastr.error('حدث خطأ أثناء تحميل البيانات', 'خطأ');
        this.isLoading = false;
      }
    });
  }

  loadAdminDashboard(): void {
    this.reportsService.getDashboardStatistics().subscribe({
      next: (stats) => {
        this.adminStats = stats;
      },
      error: (err) => {
        console.error('Error loading admin dashboard:', err);
        this.toastr.error('فشل تحميل إحصائيات لوحة التحكم', 'خطأ');
      }
    });

    this.reportsService.getRevenueReport().subscribe({
      next: (report: any) => {
        if (report.monthlyRevenue) {
          this.monthlyRevenue = report.monthlyRevenue.slice(0, 5).reverse();
        }
      },
      error: (err) => {
        console.error('Error loading revenue report:', err);
      }
    });
  }

  loadStudentDashboard(): void {
    this.reportsService.getStudentDashboard().subscribe({
      next: (stats) => {
        this.studentStats = stats;
      },
      error: (err) => {
        console.error('Error loading student dashboard:', err);
        this.toastr.error('فشل تحميل بيانات الطالب', 'خطأ');
      }
    });
  }

  loadMessages(): void {
    this.messageService.getMyMessages().subscribe({
      next: (response: any) => {
        this.messages = response.data || [];
      },
      error: (err) => {
        console.error('Error loading messages:', err);
      }
    });
  }

  checkUserRole(): void {
    const role = this.user?.role;
    this.isAdmin = role === 'Admin' || role === 'Assistant';
    this.isStudent = role === 'Student';
  }

  getInitials(): string {
    if (this.user) {
      const first = this.user.firstName?.charAt(0) || '';
      const last = this.user.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return 'U';
  }

  formatNumber(num: number): string {
    if (!num) return '0';

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('ar-EG');
  }

  // ✅ FRONTEND PDF EXPORT
  async exportReports(): Promise<void> {
    if (!this.adminStats) {
      this.toastr.warning('لا توجد بيانات للتصدير');
      return;
    }

    try {
      this.isExporting = true;
      this.toastr.info('جاري إنشاء التقرير...', 'جاري المعالجة');

      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm';
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.direction = 'rtl';
      pdfContent.style.backgroundColor = 'white';

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; font-size: 32px; margin-bottom: 10px;">تقرير النظام التعليمي</h1>
          <div style="width: 100%; height: 3px; background: linear-gradient(to right, #3B82F6, #8B5CF6); margin: 10px 0;"></div>
          <p style="color: #6B7280; font-size: 14px; margin-top: 10px;">تم الإنشاء في: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- Statistics Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #6366F1; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">📊 الإحصائيات العامة</h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
            <!-- Total Students -->
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 20px; border-radius: 12px; color: white;">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">إجمالي الطلاب</div>
              <div style="font-size: 36px; font-weight: bold;">${this.adminStats.totalStudents}</div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">+${this.adminStats.newStudentsThisMonth} هذا الشهر</div>
            </div>

            <!-- Active Groups -->
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 20px; border-radius: 12px; color: white;">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">المجموعات النشطة</div>
              <div style="font-size: 36px; font-weight: bold;">${this.adminStats.activeGroups}</div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">من ${this.adminStats.totalGroups} مجموعة</div>
            </div>

            <!-- Total Revenue -->
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 12px; color: white;">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">إجمالي الإيرادات</div>
              <div style="font-size: 36px; font-weight: bold;">${this.formatNumber(this.adminStats.totalRevenue)}</div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${this.formatNumber(this.adminStats.revenueThisMonth)} ر.س هذا الشهر</div>
            </div>

            <!-- Pending Payments -->
            <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px; border-radius: 12px; color: white;">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">مدفوعات معلقة</div>
              <div style="font-size: 36px; font-weight: bold;">${this.formatNumber(this.adminStats.pendingPayments)}</div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${this.adminStats.studentsWithPendingPayments} طالب</div>
            </div>
          </div>
        </div>

        <!-- Monthly Revenue Chart -->
        ${this.monthlyRevenue && this.monthlyRevenue.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #6366F1; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">📈 تقرير الإيرادات الشهرية</h2>
          <div style="background: #F9FAFB; padding: 20px; border-radius: 12px;">
            ${this.monthlyRevenue.map((month, index) => `
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: bold; color: #374151;">${month.monthName}</span>
                  <span style="font-weight: bold; color: #1F2937;">${this.formatNumber(month.revenue)} ر.س</span>
                </div>
                <div style="width: 100%; height: 12px; background: #E5E7EB; border-radius: 6px; overflow: hidden;">
                  <div style="width: ${this.getRevenueBarWidthNumber(month.revenue)}%; height: 100%; background: ${this.getBarColor(index)}; border-radius: 6px;"></div>
                </div>
                <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">${month.paymentsCount} دفعة</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Additional Stats -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #6366F1; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">📋 إحصائيات إضافية</h2>
          
          <table style="width: 100%; border-collapse: collapse; background: white;">
            <thead>
              <tr style="background: #F3F4F6;">
                <th style="padding: 12px; text-align: right; border: 1px solid #E5E7EB; font-weight: bold;">البند</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #E5E7EB; font-weight: bold;">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #E5E7EB;">المدفوعات اليوم</td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; color: #3B82F6;">${this.formatNumber(this.adminStats.revenueToday)} ر.س</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 10px; border: 1px solid #E5E7EB;">الامتحانات النشطة</td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; color: #F59E0B;">${this.adminStats.activeExams}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #E5E7EB;">الرسائل غير المقروءة</td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; color: #8B5CF6;">${this.adminStats.unreadMessages}</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 10px; border: 1px solid #E5E7EB;">متوسط نسبة الحضور</td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; color: #10B981;">${this.adminStats.averageAttendanceRate}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">تم إنشاء هذا التقرير بواسطة نظام الإدارة التعليمية</p>
          <p style="color: #D1D5DB; font-size: 10px; margin: 5px 0 0 0;">${new Date().toLocaleString('ar-EG')}</p>
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

      const fileName = `تقرير_النظام_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      this.isExporting = false;
      this.toastr.success('تم تصدير التقرير بنجاح', 'نجاح');
    } catch (error) {
      console.error('❌ Error exporting to PDF:', error);
      this.isExporting = false;
      this.toastr.error('حدث خطأ أثناء تصدير التقرير', 'خطأ');
    }
  }

  // ✅ Helper: Get bar width as number
  getRevenueBarWidthNumber(revenue: number): number {
    if (!this.monthlyRevenue || this.monthlyRevenue.length === 0) return 0;
    const maxRevenue = Math.max(...this.monthlyRevenue.map(m => m.revenue));
    if (maxRevenue === 0) return 0;
    return Math.min((revenue / maxRevenue) * 100, 100);
  }

  // ✅ Helper: Get bar color
  getBarColor(index: number): string {
    const colors = [
      'linear-gradient(90deg, #3B82F6, #2563EB)',
      'linear-gradient(90deg, #10B981, #059669)',
      'linear-gradient(90deg, #8B5CF6, #7C3AED)',
      'linear-gradient(90deg, #F59E0B, #D97706)',
      'linear-gradient(90deg, #EC4899, #DB2777)'
    ];
    return colors[index] || colors[0];
  }

  getRevenueBarWidth(revenue: number): string {
    return `${this.getRevenueBarWidthNumber(revenue)}%`;
  }

  openAddStudentDialog(): void {
    this.router.navigate(['/users/add']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  get unreadCount(): number {
    return this.messages.filter(msg => !msg.isRead).length;
  }
}