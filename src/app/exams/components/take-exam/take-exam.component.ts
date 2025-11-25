import { Component, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Question, QuestionType, StudentExam, SubmitAnswerDto } from '../../../models/Exam.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsService } from '../../services/exams.service';

@Component({
  selector: 'app-take-exam',
  standalone: false,
  templateUrl: './take-exam.component.html',
  styleUrl: './take-exam.component.scss'
})
export class TakeExamComponent implements OnInit, OnDestroy {
  examId: string = '';
  studentExam?: StudentExam;
  currentQuestionIndex: number = 0;
  answers: Map<string, SubmitAnswerDto> = new Map();
  timeRemaining: number = 0;
  timer: any;
  isSubmitting: boolean = false;
  hasStarted: boolean = false;
  isLoading: boolean = true;
  QuestionType = QuestionType;

  // ADD THESE PROPERTIES
  Math = Math; // Expose Math to template

  // ADD THIS GETTER
  get totalQuestions(): number {
    return this.studentExam?.exam?.questions?.length || 0;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamsService
  ) { }

  ngOnInit(): void {
    this.examId = this.route.snapshot.params['id'];
    this.checkExamAvailability();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  checkExamAvailability(): void {
    this.examService.isExamAvailableForStudent(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.checkIfStarted();
        } else {
          this.showError('الامتحان غير متاح في الوقت الحالي');
          this.router.navigate(['/exams']);
        }
      },
      error: (error) => {
        console.error('Error checking availability:', error);
        this.showError('حدث خطأ أثناء التحقق من الامتحان');
        this.router.navigate(['/exams']);
      }
    });
  }

  checkIfStarted(): void {
    this.examService.getStudentExam(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentExam = response.data;
          this.hasStarted = true;
          this.loadAnswers();
          this.startTimer();
          this.isLoading = false;
        } else {
          this.showStartDialog();
        }
      },
      error: (error) => {
        this.showStartDialog();
      }
    });
  }

  showStartDialog(): void {
    this.examService.getExamByIdWithQuestionsAndOptions(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const exam = response.data;

          Swal.fire({
            title: exam.title,
            html: `
              <div class="text-right" dir="rtl">
                <p class="mb-2"><strong>الوصف:</strong> ${exam.description}</p>
                <p class="mb-2"><strong>المدة:</strong> ${exam.duration} دقيقة</p>
                <p class="mb-2"><strong>عدد الأسئلة:</strong> ${exam.questionsCount || 0}</p>
                <p class="mb-2"><strong>الدرجة الكلية:</strong> ${exam.totalMarks}</p>
                <p class="mb-2"><strong>درجة النجاح:</strong> ${exam.passingMarks}</p>
              </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ابدأ الامتحان',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
              this.startExam();
            } else {
              this.router.navigate(['/exams']);
            }
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('حدث خطأ أثناء تحميل بيانات الامتحان');
        this.router.navigate(['/exams']);
      }
    });
  }

  startExam(): void {
    this.examService.startExam(this.examId).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasStarted = true;
          this.loadExamData();
        } else {
          this.showError(response.message || 'فشل بدء الامتحان');
        }
      },
      error: (error) => {
        console.error('Error starting exam:', error);
        this.showError('حدث خطأ أثناء بدء الامتحان');
      }
    });
  }

  loadExamData(): void {
    this.examService.getStudentExam(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentExam = response.data;
          this.loadAnswers();
          this.startTimer();
        }
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.showError('حدث خطأ أثناء تحميل الامتحان');
      }
    });
  }

  loadAnswers(): void {
    if (this.studentExam?.answers) {
      this.studentExam.answers.forEach(answer => {
        this.answers.set(answer.questionId, {
          studentExamId: answer.studentExamId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          answerText: answer.answerText
        });
      });
    }
  }

  startTimer(): void {
    if (!this.studentExam?.exam) return;

    const startTime = new Date(this.studentExam.startedAt!).getTime();
    const duration = this.studentExam.exam.duration * 60 * 1000; // Convert to milliseconds

    this.updateTimer();
    this.timer = setInterval(() => {
      this.updateTimer();

      if (this.timeRemaining <= 0) {
        this.autoSubmit();
      }
    }, 1000);
  }

  updateTimer(): void {
    if (!this.studentExam?.exam) return;

    const startTime = new Date(this.studentExam.startedAt!).getTime();
    const duration = this.studentExam.exam.duration * 60 * 1000;
    const now = new Date().getTime();
    const elapsed = now - startTime;

    this.timeRemaining = Math.max(0, duration - elapsed);
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60000);
    const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  get currentQuestion(): Question | undefined {
    return this.studentExam?.exam?.questions?.[this.currentQuestionIndex];
  }

  selectOption(optionId: string): void {
    if (!this.currentQuestion || !this.studentExam) return;

    const answer: SubmitAnswerDto = {
      studentExamId: this.studentExam.id,
      questionId: this.currentQuestion.id,
      selectedOptionId: optionId
    };

    this.answers.set(this.currentQuestion.id, answer);
    this.saveAnswer(answer);
  }

  updateTextAnswer(text: string): void {
    if (!this.currentQuestion || !this.studentExam) return;

    const answer: SubmitAnswerDto = {
      studentExamId: this.studentExam.id,
      questionId: this.currentQuestion.id,
      answerText: text
    };

    this.answers.set(this.currentQuestion.id, answer);
  }

  saveTextAnswer(): void {
    if (!this.currentQuestion) return;

    const answer = this.answers.get(this.currentQuestion.id);
    if (answer) {
      this.saveAnswer(answer);
    }
  }

  saveAnswer(answer: SubmitAnswerDto): void {
    this.examService.submitAnswer(answer).subscribe({
      next: (response) => {
        // Answer saved successfully
      },
      error: (error) => {
        console.error('Error saving answer:', error);
      }
    });
  }

  isAnswered(questionId: string): boolean {
    return this.answers.has(questionId);
  }

  getAnswer(questionId: string): SubmitAnswerDto | undefined {
    return this.answers.get(questionId);
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion(): void {
    if (this.studentExam?.exam?.questions &&
      this.currentQuestionIndex < this.studentExam.exam.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  submitExam(): void {
    const answeredCount = this.answers.size;
    const totalQuestions = this.totalQuestions; // Use getter

    Swal.fire({
      title: 'تسليم الامتحان؟',
      html: `
        <div class="text-right" dir="rtl">
          <p class="mb-2">لقد أجبت على <strong>${answeredCount}</strong> من <strong>${totalQuestions}</strong> سؤال</p>
          <p class="text-red-600">لن تتمكن من العودة بعد التسليم!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، سلم الامتحان',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.performSubmit();
      }
    });
  }

  autoSubmit(): void {
    Swal.fire({
      title: 'انتهى الوقت!',
      text: 'سيتم تسليم الامتحان تلقائياً',
      icon: 'warning',
      timer: 3000,
      showConfirmButton: false
    });

    setTimeout(() => {
      this.performSubmit();
    }, 3000);
  }

  performSubmit(): void {
    if (!this.studentExam || this.isSubmitting) return;

    this.isSubmitting = true;

    this.examService.submitExam(this.studentExam.id).subscribe({
      next: (response) => {
        if (response.success) {
          clearInterval(this.timer);
          this.showSuccess(response.message || 'تم تسليم الامتحان بنجاح');
          this.router.navigate(['/exams/result', this.studentExam!.id]);
        } else {
          this.showError(response.message || 'فشل تسليم الامتحان');
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Error submitting exam:', error);
        this.showError('حدث خطأ أثناء تسليم الامتحان');
        this.isSubmitting = false;
      }
    });
  }

  showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'نجح!',
      text: message,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'حسناً'
    });
  }

  showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'خطأ!',
      text: message,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'حسناً'
    });
  }
}