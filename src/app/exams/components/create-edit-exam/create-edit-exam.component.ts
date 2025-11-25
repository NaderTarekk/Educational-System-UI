import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Question, QuestionOption, QuestionType, UpdateExamDto } from '../../../models/Exam.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsService } from '../../services/exams.service';

@Component({
  selector: 'app-create-edit-exam',
  standalone: false,
  templateUrl: './create-edit-exam.component.html',
  styleUrl: './create-edit-exam.component.scss'
})
export class CreateEditExamComponent implements OnInit {
  isEditMode: boolean = false;
  examId?: string;
  isLoading: boolean = false;
  isSaving: boolean = false;
  QuestionType = QuestionType;

  // Form Data
  examData = {
    title: '',
    description: '',
    groupId: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 50,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isActive: true
  };

  questions: Question[] = [];
  groups: any[] = []; // TODO: Load from Groups API

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamsService
  ) { }

  ngOnInit(): void {
    this.examId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.examId;

    if (this.isEditMode) {
      this.loadExam();
    } else {
      this.addQuestion(); // Start with one question
    }

    this.loadGroups();
  }

  loadExam(): void {
    if (!this.examId) return;

    this.isLoading = true;
    this.examService.getExamByIdWithQuestionsAndOptions(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const exam = response.data;

          const startDate = new Date(exam.startDate);
          const endDate = new Date(exam.endDate);

          this.examData = {
            title: exam.title,
            description: exam.description,
            groupId: exam.groupId,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            startDate: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().substring(0, 5),
            endDate: endDate.toISOString().split('T')[0],
            endTime: endDate.toTimeString().substring(0, 5),
            isActive: exam.isActive
          };

          this.questions = exam.questions || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.showError('حدث خطأ أثناء تحميل الامتحان');
        this.isLoading = false;
      }
    });
  }

  loadGroups(): void {
    // TODO: Load groups from API
    this.groups = [
      { id: '1', name: 'المجموعة أ' },
      { id: '2', name: 'المجموعة ب' },
      { id: '3', name: 'المجموعة ج' }
    ];
  }

  addQuestion(): void {
    const newQuestion: Question = {
      id: this.generateTempId(),
      examId: this.examId || '',
      questionText: '',
      type: QuestionType.MultipleChoice,
      marks: 5,
      order: this.questions.length + 1,
      options: []
    };

    // Add default options for Multiple Choice
    this.addOption(newQuestion);
    this.addOption(newQuestion);
    this.addOption(newQuestion);
    this.addOption(newQuestion);

    this.questions.push(newQuestion);
  }

  removeQuestion(index: number): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف السؤال نهائياً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.questions.splice(index, 1);
        this.reorderQuestions();
        this.calculateTotalMarks();
      }
    });
  }

  onQuestionTypeChange(question: Question): void {
    question.options = [];

    switch (question.type) {
      case QuestionType.MultipleChoice:
        this.addOption(question);
        this.addOption(question);
        this.addOption(question);
        this.addOption(question);
        break;
      case QuestionType.TrueFalse:
        this.addOption(question, 'صح', true);
        this.addOption(question, 'خطأ', false);
        break;
      case QuestionType.Essay:
        // No options for essay
        break;
    }
  }

  addOption(question: Question, text: string = '', isCorrect: boolean = false): void {
    const newOption: QuestionOption = {
      id: this.generateTempId(),
      questionId: question.id,
      optionText: text,
      isCorrect: isCorrect,
      order: (question.options?.length || 0) + 1
    };

    if (!question.options) {
      question.options = [];
    }

    question.options.push(newOption);
  }

  removeOption(question: Question, index: number): void {
    if (question.options && question.options.length > 2) {
      question.options.splice(index, 1);
    } else {
      this.showError('يجب أن يكون هناك خياران على الأقل');
    }
  }

  setCorrectOption(question: Question, optionIndex: number): void {
    if (!question.options) return;

    // Uncheck all options
    question.options.forEach(opt => opt.isCorrect = false);

    // Check selected option
    question.options[optionIndex].isCorrect = true;
  }

  reorderQuestions(): void {
    this.questions.forEach((q, index) => {
      q.order = index + 1;
    });
  }

  calculateTotalMarks(): void {
    this.examData.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  }

  moveQuestionUp(index: number): void {
    if (index > 0) {
      [this.questions[index], this.questions[index - 1]] =
        [this.questions[index - 1], this.questions[index]];
      this.reorderQuestions();
    }
  }

  moveQuestionDown(index: number): void {
    if (index < this.questions.length - 1) {
      [this.questions[index], this.questions[index + 1]] =
        [this.questions[index + 1], this.questions[index]];
      this.reorderQuestions();
    }
  }

  validateForm(): boolean {
    if (!this.examData.title.trim()) {
      this.showError('عنوان الامتحان مطلوب');
      return false;
    }

    if (!this.examData.description.trim()) {
      this.showError('وصف الامتحان مطلوب');
      return false;
    }

    if (!this.examData.groupId) {
      this.showError('المجموعة مطلوبة');
      return false;
    }

    if (this.examData.duration < 1) {
      this.showError('مدة الامتحان يجب أن تكون على الأقل دقيقة واحدة');
      return false;
    }

    if (this.examData.passingMarks > this.examData.totalMarks) {
      this.showError('درجة النجاح لا يمكن أن تكون أكبر من الدرجة الكلية');
      return false;
    }

    if (!this.examData.startDate || !this.examData.startTime) {
      this.showError('تاريخ ووقت البداية مطلوبان');
      return false;
    }

    if (!this.examData.endDate || !this.examData.endTime) {
      this.showError('تاريخ ووقت النهاية مطلوبان');
      return false;
    }

    const startDateTime = new Date(`${this.examData.startDate}T${this.examData.startTime}`);
    const endDateTime = new Date(`${this.examData.endDate}T${this.examData.endTime}`);

    if (endDateTime <= startDateTime) {
      this.showError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return false;
    }

    if (this.questions.length === 0) {
      this.showError('يجب إضافة سؤال واحد على الأقل');
      return false;
    }

    // Validate questions
    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions[i];

      if (!question.questionText.trim()) {
        this.showError(`نص السؤال ${i + 1} مطلوب`);
        return false;
      }

      if (question.marks <= 0) {
        this.showError(`درجة السؤال ${i + 1} يجب أن تكون أكبر من صفر`);
        return false;
      }

      if (question.type !== QuestionType.Essay) {
        if (!question.options || question.options.length < 2) {
          this.showError(`السؤال ${i + 1} يجب أن يحتوي على خيارين على الأقل`);
          return false;
        }

        const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
          this.showError(`السؤال ${i + 1} يجب أن يحتوي على إجابة صحيحة واحدة على الأقل`);
          return false;
        }

        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].optionText.trim()) {
            this.showError(`نص الخيار ${j + 1} في السؤال ${i + 1} مطلوب`);
            return false;
          }
        }
      }
    }

    return true;
  }

  saveExam(): void {
    if (!this.validateForm()) return;

    this.isSaving = true;

    const startDateTime = new Date(`${this.examData.startDate}T${this.examData.startTime}`);
    const endDateTime = new Date(`${this.examData.endDate}T${this.examData.endTime}`);

    if (this.isEditMode && this.examId) {
      const updateDto: UpdateExamDto = {
        id: this.examId,
        title: this.examData.title,
        description: this.examData.description,
        groupId: this.examData.groupId,
        duration: this.examData.duration,
        totalMarks: this.examData.totalMarks,
        passingMarks: this.examData.passingMarks,
        startDate: startDateTime,
        endDate: endDateTime,
        isActive: this.examData.isActive
      };

      this.examService.updateExam(this.examId, updateDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('تم تحديث الامتحان بنجاح');
            this.router.navigate(['/exams']);
          } else {
            this.showError(response.message || 'فشل تحديث الامتحان');
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating exam:', error);
          this.showError('حدث خطأ أثناء تحديث الامتحان');
          this.isSaving = false;
        }
      });
    } else {
      const createDto: any = {
        id: '00000000-0000-0000-0000-000000000000',
        title: this.examData.title,
        description: this.examData.description,
        groupId: this.examData.groupId,
        duration: this.examData.duration,
        totalMarks: this.examData.totalMarks,
        passingMarks: this.examData.passingMarks,
        startDate: startDateTime,
        endDate: endDateTime,
        isActive: this.examData.isActive,
        createdBy: localStorage.getItem('userId') || 'admin',
        createdAt: new Date(),
        questions: this.questions.map(q => ({
          id: '00000000-0000-0000-0000-000000000000',
          examId: '00000000-0000-0000-0000-000000000000',
          questionText: q.questionText,
          type: q.type,
          marks: q.marks,
          order: q.order,
          options: q.options?.map(opt => ({
            id: '00000000-0000-0000-0000-000000000000',
            questionId: '00000000-0000-0000-0000-000000000000',
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: opt.order
          })) || []
        }))
      };

      this.examService.createExam(createDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('تم إنشاء الامتحان بنجاح');
            this.router.navigate(['/exams']);
          } else {
            this.showError(response.message || 'فشل إنشاء الامتحان');
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error creating exam:', error);
          this.showError('حدث خطأ أثناء إنشاء الامتحان');
          this.isSaving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/exams']);
  }

  generateTempId(): string {
    return 'temp_' + Math.random().toString(36).substr(2, 9);
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
