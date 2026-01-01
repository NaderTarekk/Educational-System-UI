import { Component, OnInit } from '@angular/core';
import { QuestionType, StudentExam } from '../../../models/Exam.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsService } from '../../services/exams.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-exam-result',
  standalone: false,
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.scss'
})
export class ExamResultComponent implements OnInit {
 studentExamId: string = '';
  result: any = null;
  isLoading = false;
  Math = Math; 
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.studentExamId = this.route.snapshot.params['id'];
    this.loadResult();
  }

  loadResult(): void {
    this.isLoading = true;
    
    this.examService.getStudentExamResult(this.studentExamId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.result = response.data;
          console.log('Result:', this.result);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('فشل تحميل النتيجة');
        this.router.navigate(['/exams']);
        this.isLoading = false;
      }
    });
  }

  get totalQuestions(): number {
    return this.result?.exam?.questions?.length || 0;
  }

  get answeredQuestions(): number {
    return this.result?.answers?.length || 0;
  }

  get correctAnswers(): number {
    return this.result?.answers?.filter((a: any) => a.isCorrect === true).length || 0;
  }

  get wrongAnswers(): number {
    return this.result?.answers?.filter((a: any) => a.isCorrect === false).length || 0;
  }

  get essayAnswers(): number {
    return this.result?.answers?.filter((a: any) => a.question?.type === 2).length || 0;
  }

  get percentage(): number {
    const total = this.result?.exam?.totalMarks || 0;
    const score = this.result?.score || 0;
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  get isPassed(): boolean {
    const score = this.result?.score || 0;
    const passing = this.result?.exam?.passingMarks || 0;
    return score >= passing;
  }

  getQuestionTypeText(type: any): string {
    const typeNum = typeof type === 'number' ? type : this.getQuestionTypeNumber(type);
    switch (typeNum) {
      case 0: return 'اختيار من متعدد';
      case 1: return 'صح أو خطأ';
      case 2: return 'سؤال مقالي';
      default: return 'غير معروف';
    }
  }

  getQuestionTypeNumber(type: any): number {
    if (typeof type === 'number') return type;
    switch (type) {
      case 'MultipleChoice': return 0;
      case 'TrueFalse': return 1;
      case 'Essay': return 2;
      default: return 0;
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  backToExams(): void {
    this.router.navigate(['/exams/my-exams']);
  }
}
