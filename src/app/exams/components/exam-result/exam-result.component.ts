import { Component, OnInit } from '@angular/core';
import { QuestionType, StudentExam } from '../../../models/Exam.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsService } from '../../services/exams.service';

@Component({
  selector: 'app-exam-result',
  standalone: false,
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.scss'
})
export class ExamResultComponent implements OnInit {
  studentExamId: string = '';
  studentExam?: StudentExam;
  isLoading: boolean = true;
  QuestionType = QuestionType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamsService
  ) { }

  ngOnInit(): void {
    this.studentExamId = this.route.snapshot.params['id'];
    this.loadResult();
  }

  loadResult(): void {
    this.examService.getStudentExamResult(this.studentExamId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentExam = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading result:', error);
        this.isLoading = false;
      }
    });
  }

  get correctAnswersCount(): number {
    return this.studentExam?.answers?.filter(a => a.isCorrect).length || 0;
  }

  get totalQuestions(): number {
    return this.studentExam?.exam?.questions?.length || 0;
  }

  get percentage(): number {
    if (!this.studentExam?.exam?.totalMarks || !this.studentExam.score) return 0;
    return (this.studentExam.score / this.studentExam.exam.totalMarks) * 100;
  }

  get isPassed(): boolean {
    if (!this.studentExam?.exam || !this.studentExam.score) return false;
    return this.studentExam.score >= this.studentExam.exam.passingMarks;
  }

  getResultColor(): string {
    const percentage = this.percentage;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  getResultBgColor(): string {
    const percentage = this.percentage;
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 75) return 'bg-blue-100';
    if (percentage >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  }

  backToExams(): void {
    this.router.navigate(['/exams']);
  }

  getTimeTaken(): number {
    if (!this.studentExam?.submittedAt || !this.studentExam?.startedAt) return 0;

    const submittedTime = new Date(this.studentExam.submittedAt).getTime();
    const startedTime = new Date(this.studentExam.startedAt).getTime();
    const timeDiff = submittedTime - startedTime;

    return Math.round(timeDiff / 60000); // Convert to minutes
  }
}
