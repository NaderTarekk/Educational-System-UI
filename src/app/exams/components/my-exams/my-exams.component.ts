import { Component, OnInit } from '@angular/core';
import { ExamsService } from '../../services/exams.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-exams',
  standalone: false,
  templateUrl: './my-exams.component.html',
  styleUrl: './my-exams.component.scss'
})
export class MyExamsComponent implements OnInit {
  availableExams: any[] = [];
  completedExams: any[] = [];
  isLoading = false;
  selectedTab: 'available' | 'completed' = 'available';

  constructor(
    private router: Router,
    private examService: ExamsService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading = true;

    // Load available exams (active exams)
    this.examService.getActiveExams().subscribe({
      next: (response) => {
        console.log(response);
        
        if (response.success && response.data) {
          this.availableExams = response.data;
          this.processExams(this.availableExams);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading available exams:', error);
        this.toastr.error('فشل تحميل الامتحانات المتاحة');
        this.isLoading = false;
      }
    });

    // Load completed exams (student's exam history)
    this.loadCompletedExams();
  }

  loadCompletedExams(): void {
    this.examService.getStudentExamHistory().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.completedExams = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading completed exams:', error);
        // مش مشكلة لو فاضي
      }
    });
  }

  processExams(exams: any[]): void {
    const now = new Date();

    exams.forEach(exam => {
      const startDate = new Date(exam.startDate);
      const endDate = new Date(exam.endDate);

      if (exam.isActive && startDate <= now && endDate >= now) {
        exam.status = 'active';
        exam.statusText = 'نشط';
      } else if (startDate > now) {
        exam.status = 'upcoming';
        exam.statusText = 'قادم';
      } else {
        exam.status = 'completed';
        exam.statusText = 'مكتمل';
      }
    });
  }

  selectTab(tab: 'available' | 'completed'): void {
    this.selectedTab = tab;
  }

  startExam(examId: string): void {
    this.router.navigate(['/exams/take', examId]);
  }

  viewResult(studentExamId: string): void {
    this.router.navigate(['/exams/result', studentExamId]);
  }

  getExamAvatar(title: string): string {
    if (!title) return '??';

    const words = title.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600 border-green-300';
      case 'upcoming':
        return 'bg-orange-100 text-orange-600 border-orange-300';
      case 'completed':
        return 'bg-purple-100 text-purple-600 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  }

  getTimeRemaining(endDate: Date | string): string {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'انتهى';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ${days === 1 ? 'يوم' : 'أيام'} متبقي`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'} متبقية`;
    if (minutes > 0) return `${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'} متبقية`;

    return 'أقل من دقيقة';
  }

  // Helper methods for filtering (إذا لم تستخدم pipe)
  getActiveExamsCount(): number {
    return this.availableExams.filter(e => e.status === 'active').length;
  }

  getUpcomingExamsCount(): number {
    return this.availableExams.filter(e => e.status === 'upcoming').length;
  }
}
