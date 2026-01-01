import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsService } from '../../services/exams.service';
import { ToastrService } from 'ngx-toastr';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-take-exam',
  standalone: false,
  templateUrl: './take-exam.component.html',
  styleUrls: ['./take-exam.component.scss']
})
export class TakeExamComponent implements OnInit, OnDestroy {
  examId: string = '';
  exam: any = null;
  studentExam: any = null;
  questions: any[] = [];
  currentQuestionIndex = 0;
  answers: Map<string, any> = new Map();
  String = String;
  // Timer
  timeRemaining: number = 0;
  timerSubscription?: Subscription;

  // UI States
  isLoading = false;
  isSubmitting = false;
  isExamStarted = false;
  isExamFinished = false;
  showConfirmSubmit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamsService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.examId = this.route.snapshot.params['id'];
    this.checkExamAvailability();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  checkExamAvailability(): void {
    this.isLoading = true;

    this.examService.isExamAvailableForStudent(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loadExam();
        } else {
          this.toastr.error('هذا الامتحان غير متاح في الوقت الحالي');
          this.router.navigate(['/exams']);
        }
      },
      error: (error) => {
        this.toastr.error('حدث خطأ أثناء التحقق من الامتحان');
        this.router.navigate(['/exams']);
        this.isLoading = false;
      }
    });
  }

  // ✅ عدّل getAnswer method
  getAnswer(questionId: string): any {
    return this.answers.get(questionId) || { selectedOptionId: null, answerText: '' };
  }
  
  loadExam(): void {
    this.examService.getExamByIdWithQuestionsAndOptions(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.exam = response.data;

          // ✅ تحويل Type من string لـ number
          this.questions = (response.data.questions || []).map((q: any) => {
            console.log("❓ Question Type:", q.type, "→", this.convertQuestionType(q.type));
            return {
              ...q,
              type: this.convertQuestionType(q.type)
            };
          });

          this.checkIfAlreadyStarted();
        } else {
          console.error("❌ Response Failed:", response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error("❌ API Error:", error);
        this.toastr.error('فشل تحميل الامتحان');
        this.router.navigate(['/exams']);
        this.isLoading = false;
      }
    });
  }

  // ✅ أضف هذه الـ method
  convertQuestionType(type: any): number {
    if (typeof type === 'number') return type;

    const typeStr = typeof type === 'string' ? type.toLowerCase() : '';

    switch (typeStr) {
      case 'multiplechoice':
      case '0':
        return 0;
      case 'truefalse':
      case '1':
        return 1;
      case 'essay':
      case '2':
        return 2;
      default:
        console.warn('⚠️ Unknown question type:', type);
        return 0;
    }
  }

  checkIfAlreadyStarted(): void {
    this.examService.getStudentExam(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // الطالب بدأ الامتحان من قبل
          this.studentExam = response.data;
          this.loadPreviousAnswers();
          this.startTimer();
          this.isExamStarted = true;
        }
      },
      error: () => {
        // الطالب لم يبدأ الامتحان بعد
        this.isExamStarted = false;
      }
    });
  }

  loadPreviousAnswers(): void {
    if (this.studentExam?.answers) {
      this.studentExam.answers.forEach((answer: any) => {
        this.answers.set(answer.questionId, {
          selectedOptionId: answer.selectedOptionId,
          answerText: answer.answerText
        });
      });
    }
  }

  startExam(): void {
    this.isLoading = true;

    this.examService.startExam(this.examId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم بدء الامتحان بنجاح');
          this.isExamStarted = true;
          this.loadExam(); // Reload to get studentExam
          this.startTimer();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('فشل بدء الامتحان');
        this.isLoading = false;
      }
    });
  }

  startTimer(): void {
    if (!this.studentExam || !this.exam) return;

    const startTime = new Date(this.studentExam.startedAt).getTime();
    const duration = this.exam.duration * 60 * 1000; // Convert to milliseconds
    const endTime = startTime + duration;

    this.timerSubscription = interval(1000).subscribe(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      this.timeRemaining = Math.floor(remaining / 1000);

      if (this.timeRemaining <= 0) {
        this.autoSubmitExam();
      }
    });
  }

  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  get timeRemainingFormatted(): string {
    const hours = Math.floor(this.timeRemaining / 3600);
    const minutes = Math.floor((this.timeRemaining % 3600) / 60);
    const seconds = this.timeRemaining % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get currentQuestion(): any {
    return this.questions[this.currentQuestionIndex];
  }

  selectOption(questionId: string, optionId: string): void {
    this.answers.set(questionId, {
      selectedOptionId: optionId,
      answerText: null
    });
    this.saveAnswer(questionId);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  updateEssayAnswer(questionId: string, text: string): void {
    const existingAnswer = this.answers.get(questionId) || {};
    this.answers.set(questionId, {
      ...existingAnswer,
      selectedOptionId: null,
      answerText: text
    });
  }

  saveEssayAnswer(questionId: string): void {
    this.saveAnswer(questionId);
  }

  saveAnswer(questionId: string): void {
    if (!this.studentExam) return;

    const answer = this.answers.get(questionId);
    if (!answer) return;

    const submitDto = {
      studentExamId: this.studentExam.id,
      questionId: questionId,
      selectedOptionId: answer.selectedOptionId,
      answerText: answer.answerText
    };

    this.examService.submitAnswer(submitDto).subscribe({
      next: (response) => {
        if (!response.success) {
          this.toastr.error('فشل حفظ الإجابة');
        }
      },
      error: () => {
        this.toastr.error('فشل حفظ الإجابة');
      }
    });
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  isQuestionAnswered(index: number): boolean {
    const question = this.questions[index];
    return this.answers.has(question.id);
  }

  get answeredQuestionsCount(): number {
    return this.answers.size;
  }

  confirmSubmit(): void {
    this.showConfirmSubmit = true;
  }

  cancelSubmit(): void {
    this.showConfirmSubmit = false;
  }

  submitExam(): void {
    this.isSubmitting = true;
    this.showConfirmSubmit = false;

    this.examService.submitExam(this.studentExam.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.stopTimer();
          this.toastr.success('تم تسليم الامتحان بنجاح');
          this.viewResults();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.toastr.error('فشل تسليم الامتحان');
        this.isSubmitting = false;
      }
    });
  }

  autoSubmitExam(): void {
    this.toastr.warning('انتهى وقت الامتحان - سيتم التسليم تلقائياً');
    this.submitExam();
  }

  viewResults(): void {
    this.router.navigate(['/exams/result', this.studentExam.id]);
  }
}