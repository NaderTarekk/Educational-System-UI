import { Component, OnInit, ViewChild } from '@angular/core';
import { Exam, CreateExamDto, UpdateExamDto } from '../../../models/Exam.model';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ExamsService } from '../../services/exams.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { HttpHeaders } from '@angular/common/http';
import { GroupsService } from '../../../groups/services/groups.service';

enum QuestionType {
  MultipleChoice = 0,
  TrueFalse = 1,
  Essay = 2
}

@Component({
  selector: 'app-exams-list',
  standalone: false,
  templateUrl: './exams-list.component.html',
  styleUrl: './exams-list.component.scss'
})
export class ExamsListComponent implements OnInit {
  exams: Exam[] = [];
  allExams: Exam[] = [];
  isDialogOpen = false;
  isEditMode = false;
  examForm: FormGroup;
  selectedExamId: string | null = null;
  searchTerm = '';
  selectedStatus = 'all';
  isLoading = false;
  isDeleteDialogOpen = false;
  examToDelete: Exam | null = null;
  isViewDialogOpen = false;
  viewedExam: any | null = null;
  isLoadingExamDetails = false;
  userRole: any;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  pageSizeOptions = [5, 10, 25, 50, 100];
  String = String;
  groups: any[] = [];
  Math = Math;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private examService: ExamsService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private groupService: GroupsService
  ) {
    this.examForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      groupId: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(1)]],
      totalMarks: [100, [Validators.required, Validators.min(1)]],
      passingMarks: [50, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [false],
      createdBy: [''],
      questions: this.fb.array([]) // Add questions array
    });
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('NHC_PL_Role');
    const userId = localStorage.getItem('NHC_PL_UserId') || '';

    // Set createdBy in form
    this.examForm.patchValue({ createdBy: userId });

    this.loadGroups();
    this.loadExams();
  }

  loadGroups(): void {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('NHC_PL_Token')}`
    });

    this.groupService.getAllGroups().subscribe((res: any) => {
      this.groups = res.data
    })
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
  loadExams(pageNumber: number = 1, pageSize: number = this.pageSize): void {
    this.isLoading = true;

    if (this.userRole === 'Student') {
      this.examService.getActiveExams().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allExams = response.data;
            this.processExams();
            this.applyFiltersAndPagination();
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
        }
      });
    } else {
      this.examService.getAllExams().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allExams = response.data;
            this.processExams();
            this.applyFiltersAndPagination();
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
        }
      });
    }
  }

  processExams(): void {
    const now = new Date();

    this.allExams.forEach(exam => {
      const startDate = new Date(exam.startDate);
      const endDate = new Date(exam.endDate);

      if (exam.isActive && startDate <= now && endDate >= now) {
        (exam as any).status = 'active';
        (exam as any).statusText = 'نشط';
      } else if (startDate > now) {
        (exam as any).status = 'upcoming';
        (exam as any).statusText = 'قادم';
      } else {
        (exam as any).status = 'completed';
        (exam as any).statusText = 'مكتمل';
      }
    });
  }

  applyFiltersAndPagination(): void {
    let filtered = [...this.allExams];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(search) ||
        exam.description.toLowerCase().includes(search) ||
        (exam.group?.name && exam.group.name.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((exam: any) => exam.status === this.selectedStatus);
    }

    this.totalCount = filtered.length;

    // Apply pagination
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.exams = filtered.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.pageNumber = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.applyFiltersAndPagination();
  }

  onStatusChange(event: any): void {
    this.selectedStatus = event.target.value;
    this.pageNumber = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.applyFiltersAndPagination();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageIndex + 1;
    this.applyFiltersAndPagination();
  }

  get activeCount(): number {
    return this.allExams.filter((e: any) => e.status === 'active').length;
  }

  get upcomingCount(): number {
    return this.allExams.filter((e: any) => e.status === 'upcoming').length;
  }

  get completedCount(): number {
    return this.allExams.filter((e: any) => e.status === 'completed').length;
  }

  get filteredExams(): Exam[] {
    return this.exams;
  }

  getExamAvatar(title: string): string {
    const words = title.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600';
      case 'upcoming':
        return 'bg-orange-100 text-orange-600';
      case 'completed':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
  // دالة لحساب نسبة النجاح من الفورم مباشرة
  calculatePassPercentage(): number {
    const passingMarks = this.examForm.get('passingMarks')?.value || 0;
    const totalMarks = this.examForm.get('totalMarks')?.value || 0;

    if (totalMarks === 0) return 0;

    return Math.round((passingMarks / totalMarks) * 100);
  }
  openDialog(exam?: any): void {
    this.isDialogOpen = true;
    document.body.style.overflow = 'hidden';

    if (exam) {
      this.isEditMode = true;
      this.selectedExamId = exam.id || null;

      // Format dates for datetime-local input
      const startDate = new Date(exam.startDate);
      const endDate = new Date(exam.endDate);

      this.examForm.patchValue({
        title: exam.title,
        description: exam.description,
        groupId: exam.groupId,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        startDate: this.formatDateForInput(startDate),
        endDate: this.formatDateForInput(endDate),
        isActive: exam.isActive,
        createdBy: exam.createdBy
      });
    } else {
      this.isEditMode = false;
      this.selectedExamId = null;
      const userId = localStorage.getItem('NHC_PL_UserId') || '';
      this.examForm.reset({
        duration: 60,
        totalMarks: 100,
        passingMarks: 50,
        isActive: false,
        createdBy: userId
      });
    }
  }

  closeDialog(): void {
    this.isDialogOpen = false;
    document.body.style.overflow = 'auto';
    this.examForm.reset();
    this.isEditMode = false;
    this.selectedExamId = null;
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.closeDialog();
    }
  }

  checkValue(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const wrapper = input.closest('.input-wrapper');
    if (input.value.trim() !== '') {
      wrapper?.classList.add('has-value');
    } else {
      wrapper?.classList.remove('has-value');
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // ===== Questions Management =====

  get questions(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  createQuestionForm(): FormGroup {
    return this.fb.group({
      questionText: ['', Validators.required],
      type: [0, Validators.required], // 0 = MultipleChoice
      marks: [1, [Validators.required, Validators.min(0.5)]],
      order: [this.questions.length + 1],
      options: this.fb.array([])
    });
  }

  createOptionForm(): FormGroup {
    return this.fb.group({
      optionText: ['', Validators.required],
      isCorrect: [false],
      order: [0]
    });
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
    // تحديث الترتيب للأسئلة المتبقية
    this.questions.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
    // إعادة حساب إجمالي الدرجات
    this.calculateTotalMarks();
  }


  onQuestionTypeChange(questionIndex: number): void {
    const question = this.questions.at(questionIndex) as FormGroup;
    const type = Number(question.get('type')?.value);
    // Clear all existing options completely
    const optionsArray = question.get('options') as FormArray;
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }

    // Rebuild options based on new type
    this.initializeQuestionOptions(question, type);
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    options.removeAt(optionIndex);
    // Update order for remaining options
    options.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  getQuestionTypeName(type: number): string {
    switch (type) {
      case 0: return 'اختيار من متعدد';
      case 1: return 'صح أو خطأ';
      case 2: return 'مقالي';
      default: return 'غير معروف';
    }
  }

  calculateTotalMarks(): void {
    let total = 0;
    this.questions.controls.forEach(question => {
      const marks = question.get('marks')?.value || 0;
      total += Number(marks);
    });
    this.examForm.patchValue({ totalMarks: total });
  }

  setCorrectOption(questionIndex: number, optionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);

    // Set all options to false first
    for (let i = 0; i < options.length; i++) {
      options.at(i).patchValue({ isCorrect: false });
    }

    // Set the selected option to true
    options.at(optionIndex).patchValue({ isCorrect: true });
    const optionText = options.at(optionIndex).get('optionText')?.value;
  }

  viewExam(id: string): void {
    this.isLoadingExamDetails = true;
    this.isViewDialogOpen = true;
    document.body.style.overflow = 'hidden';

    this.examService.getExamById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.viewedExam = response.data;

          this.processExamStatus(this.viewedExam);
        } else {
          this.showError(response.message);
          this.closeViewDialog();
        }
        this.isLoadingExamDetails = false;
      },
      error: (error) => {
        this.showError('حدث خطأ أثناء تحميل بيانات الامتحان');
        this.closeViewDialog();
        this.isLoadingExamDetails = false;
      }
    });
  }

  processExamStatus(exam: Exam): void {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (exam.isActive && startDate <= now && endDate >= now) {
      (exam as any).status = 'active';
      (exam as any).statusText = 'نشط';
    } else if (startDate > now) {
      (exam as any).status = 'upcoming';
      (exam as any).statusText = 'قادم';
    } else {
      (exam as any).status = 'completed';
      (exam as any).statusText = 'مكتمل';
    }
  }

  closeViewDialog(): void {
    this.isViewDialogOpen = false;
    this.viewedExam = null;
    document.body.style.overflow = 'auto';
  }

  getPassPercentage(exam: Exam): number {
    if (!exam) return 0;
    return Math.round((exam.passingMarks / exam.totalMarks) * 100);
  }

  openDeleteDialog(exam: Exam): void {
    this.examToDelete = exam;
    this.isDeleteDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.examToDelete = null;
    document.body.style.overflow = 'auto';
  }

  confirmDelete(): void {
    if (this.examToDelete && this.examToDelete.id) {
      this.isLoading = true;
      this.examService.deleteExam(this.examToDelete.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message || 'تم حذف الامتحان بنجاح');
            this.closeDeleteDialog();
            this.loadExams();
          } else {
            this.showError(response.message);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.showError('حدث خطأ أثناء حذف الامتحان');
          this.isLoading = false;
        }
      });
    }
  }

  startExam(examId: string): void {
    this.router.navigate(['/exams/take', examId]);
  }

  private handleError(error: any): void {
    if (error.status === 401) {
      localStorage.removeItem('NHC_PL_Token');
      localStorage.removeItem('NHC_PL_Role');
      this.toastr.info('قم بتسجيل الدخول أولاً');
      this.router.navigate(['/auth/login']);
    } else if (error.status === 403) {
      this.toastr.warning('ليس لديك صلاحية للوصول إلى هذا الجزء من النظام.');
      this.router.navigate(['/']);
    } else {
      this.showError(error.error?.message || 'حدث خطأ أثناء تحميل الامتحانات');
    }
  }

  private showSuccess(message: string): void {
    this.toastr.success(message);
  }

  private showError(message: string): void {
    this.toastr.error(message);
  }

  addQuestion(): void {
    const questionForm = this.fb.group({
      questionText: ['', Validators.required],
      type: [0, Validators.required], // Default to MultipleChoice
      marks: [1, [Validators.required, Validators.min(0.5)]],
      order: [this.questions.length + 1],
      options: this.fb.array([])
    });

    // Initialize options for default type (MultipleChoice)
    this.initializeQuestionOptions(questionForm, 0);

    this.questions.push(questionForm);
  }


  // دالة مساعدة لتهيئة الاختيارات حسب نوع السؤال
  private initializeQuestionOptions(questionForm: FormGroup, type: number): void {
    const optionsArray = questionForm.get('options') as FormArray;

    // Clear completely first
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }

    switch (type) {
      case 0: // MultipleChoice
        // إضافة 4 اختيارات فارغة
        for (let i = 0; i < 4; i++) {
          const option = this.fb.group({
            optionText: [`الاختيار ${String.fromCharCode(65 + i)}`, Validators.required],
            isCorrect: [false],
            order: [i + 1]
          });
          optionsArray.push(option);
        }
        break;

      case 1: // TrueFalse
        // إضافة اختياري صح وخطأ
        const trueOption = this.fb.group({
          optionText: ['صح', Validators.required],
          isCorrect: [false],
          order: [1]
        });
        optionsArray.push(trueOption);

        const falseOption = this.fb.group({
          optionText: ['خطأ', Validators.required],
          isCorrect: [false],
          order: [2]
        });
        optionsArray.push(falseOption);
        break;

      case 2: // Essay
        // الأسئلة المقالية لا تحتاج اختيارات
        break;
    }
  }

  getQuestionOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  // دالة إضافة اختيار (للـ Multiple Choice فقط)
  addOption(questionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    const option = this.createOptionForm();
    option.patchValue({
      order: options.length + 1,
      optionText: `الاختيار ${options.length + 1}`
    });
    options.push(option);
  }
  // دالة للتحقق من صحة الاختيارات
  validateQuestionOptions(questionIndex: number): { valid: boolean; message: string } {
    const question = this.questions.at(questionIndex);
    const type = question.get('type')?.value;
    const questionText = question.get('questionText')?.value;
    const options = this.getQuestionOptions(questionIndex);

    // التحقق من وجود نص السؤال
    if (!questionText || !questionText.trim()) {
      return { valid: false, message: 'يجب كتابة نص السؤال' };
    }

    // الأسئلة المقالية لا تحتاج اختيارات
    if (type === QuestionType.Essay) {
      return { valid: true, message: '' };
    }

    // التحقق من وجود اختيارات
    if (options.length === 0) {
      return { valid: false, message: 'يجب إضافة اختيارات للسؤال' };
    }

    // التحقق من عدم وجود اختيارات فارغة
    const hasEmptyOption = options.controls.some(opt => {
      const text = opt.get('optionText')?.value;
      return !text || !text.trim();
    });
    if (hasEmptyOption) {
      return { valid: false, message: 'جميع الاختيارات يجب أن تحتوي على نص' };
    }

    // التحقق من وجود إجابة صحيحة واحدة على الأقل
    const hasCorrectAnswer = options.controls.some(opt => opt.get('isCorrect')?.value === true);
    if (!hasCorrectAnswer) {
      return { valid: false, message: 'يجب تحديد الإجابة الصحيحة' };
    }

    return { valid: true, message: '' };
  }

  // دالة للحصول على لون نوع السؤال
  getQuestionTypeColor(type: number): string {
    switch (type) {
      case QuestionType.MultipleChoice:
        return 'from-blue-600 to-blue-700';
      case QuestionType.TrueFalse:
        return 'from-green-600 to-green-700';
      case QuestionType.Essay:
        return 'from-purple-600 to-purple-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  }

  getQuestionTypeIcon(type: number): string {
    switch (type) {
      case QuestionType.MultipleChoice:
        return 'fa-list-ul';
      case QuestionType.TrueFalse:
        return 'fa-check-circle';
      case QuestionType.Essay:
        return 'fa-file-alt';
      default:
        return 'fa-question';
    }
  }

  getQuestionTypeText(type: any): string {
    const typeNum = this.getQuestionTypeNumber(type);
    switch (typeNum) {
      case 0: return 'اختيار من متعدد';
      case 1: return 'صح أو خطأ';
      case 2: return 'سؤال مقالي';
      default: return 'غير معروف';
    }
  }
  getQuestionTypeIconView(type: any): string {
    const typeNum = this.getQuestionTypeNumber(type);
    switch (typeNum) {
      case 0: return 'fa-list-ul';
      case 1: return 'fa-check-circle';
      case 2: return 'fa-file-alt';
      default: return 'fa-question';
    }
  }

  // تحسين دالة الحفظ مع التحقق من الاختيارات
  saveExam(): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      this.showError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    // التحقق من صحة الأسئلة والاختيارات
    if (this.questions.length > 0) {
      for (let i = 0; i < this.questions.length; i++) {
        const validation = this.validateQuestionOptions(i);
        if (!validation.valid) {
          this.showError(`السؤال رقم ${i + 1}: ${validation.message}`);
          return;
        }
      }
    }

    this.isLoading = true;
    const formValue = this.examForm.value;

    // تجهيز بيانات الأسئلة (للإنشاء والتحديث)
    const questionsData = formValue.questions && formValue.questions.length > 0
      ? formValue.questions
        .filter((q: any) => q.questionText && q.questionText.trim())
        .map((q: any, index: number) => {
          const questionDto: any = {
            id: q.id || '00000000-0000-0000-0000-000000000000',
            questionText: q.questionText.trim(),
            type: this.getQuestionTypeString(Number(q.type)), // تحويل لـ string
            marks: Number(q.marks),
            order: index + 1,
            options: []
          };

          // إضافة الاختيارات فقط إذا كان النوع ليس مقالي
          if (q.type !== 2 && q.options && q.options.length > 0) {
            questionDto.options = q.options
              .filter((opt: any) => opt.optionText && opt.optionText.trim())
              .map((opt: any, optIndex: number) => ({
                id: opt.id || '00000000-0000-0000-0000-000000000000',
                optionText: opt.optionText.trim(),
                isCorrect: Boolean(opt.isCorrect),
                order: optIndex + 1
              }));
          }

          return questionDto;
        })
      : [];

    if (this.isEditMode && this.selectedExamId) {
      // تحديث الامتحان - نفس الـ structure بتاع Create
      const updateData: any = {
        id: this.selectedExamId,
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        groupId: formValue.groupId,
        duration: Number(formValue.duration),
        totalMarks: Number(formValue.totalMarks),
        passingMarks: Number(formValue.passingMarks),
        startDate: this.formatDateTime(formValue.startDate),
        endDate: this.formatDateTime(formValue.endDate),
        isActive: Boolean(formValue.isActive),
        createdAt: new Date().toISOString(), // أو استخدم createdAt الأصلي
        questionsCount: questionsData.length,
        questions: questionsData
      };

      console.log('📤 Update Data:', updateData);

      this.examService.updateExam(this.selectedExamId, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message || 'تم تحديث الامتحان بنجاح');
            this.closeDialog();
            this.loadExams();
          } else {
            this.showError(response.message);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Update Error:', error);
          if (error.error?.errors) {
            const errorMessages = Object.entries(error.error.errors)
              .map(([key, value]: [string, any]) => `${key}: ${value.join(', ')}`)
              .join('\n');
            this.showError(`أخطاء في البيانات:\n${errorMessages}`);
          } else {
            this.showError(error.error?.message || 'حدث خطأ أثناء تحديث الامتحان');
          }
          this.isLoading = false;
        }
      });
    } else {
      // إنشاء امتحان جديد
      const createData: any = {
        id: '00000000-0000-0000-0000-000000000000',
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        groupId: formValue.groupId,
        duration: Number(formValue.duration),
        totalMarks: Number(formValue.totalMarks),
        passingMarks: Number(formValue.passingMarks),
        startDate: this.formatDateTime(formValue.startDate),
        endDate: this.formatDateTime(formValue.endDate),
        isActive: Boolean(formValue.isActive),
        createdAt: new Date().toISOString(),
        questionsCount: questionsData.length,
        questions: questionsData
      };

      console.log('📤 Create Data:', createData);

      this.examService.createExam(createData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message || 'تم إنشاء الامتحان بنجاح');
            this.closeDialog();
            this.loadExams();
          } else {
            this.showError(response.message);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Create Error:', error);
          if (error.error?.errors) {
            const errorMessages = Object.entries(error.error.errors)
              .map(([key, value]: [string, any]) => `${key}: ${value.join(', ')}`)
              .join('\n');
            this.showError(`أخطاء في البيانات:\n${errorMessages}`);
          } else {
            this.showError(error.error?.message || 'حدث خطأ أثناء إنشاء الامتحان');
          }
          this.isLoading = false;
        }
      });
    }
  }

  // دالة لتحويل type من number لـ string
  getQuestionTypeString(type: number): string {
    switch (type) {
      case 0: return 'MultipleChoice';
      case 1: return 'TrueFalse';
      case 2: return 'Essay';
      default: return 'MultipleChoice';
    }
  }

  private formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const [date, time] = dateTimeString.split('T');
    return `${date}T${time}:00.000Z`;
  }

  getCompletedQuestionsCount(): number {
    let completedCount = 0;

    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions.at(i);
      const type = question.get('type')?.value;

      // الأسئلة المقالية تعتبر مكتملة إذا كان لها نص
      if (type === 2) {
        const questionText = question.get('questionText')?.value;
        if (questionText && questionText.trim()) {
          completedCount++;
        }
      } else {
        // أسئلة الاختيارات تعتبر مكتملة إذا كان لها نص وإجابة صحيحة
        const questionText = question.get('questionText')?.value;
        const options = this.getQuestionOptions(i);
        const hasCorrectAnswer = options.controls.some(opt => opt.get('isCorrect')?.value === true);
        const hasAllOptionsText = options.controls.every(opt => {
          const text = opt.get('optionText')?.value;
          return text && text.trim();
        });

        if (questionText && questionText.trim() && hasCorrectAnswer && hasAllOptionsText) {
          completedCount++;
        }
      }
    }

    return completedCount;
  }

  // دالة للتحقق من وجود إجابة صحيحة في السؤال
  hasCorrectAnswer(questionIndex: number): boolean {
    const options = this.getQuestionOptions(questionIndex);
    return options.controls.some(opt => opt.get('isCorrect')?.value === true);
  }

  // دالة للتحقق من أن جميع الاختيارات لها نص
  hasAllOptionsText(questionIndex: number): boolean {
    const options = this.getQuestionOptions(questionIndex);
    return options.controls.every(opt => {
      const text = opt.get('optionText')?.value;
      return text && text.trim();
    });
  }

  // دالة للتحقق من وجود اختيارات فارغة
  hasEmptyOptions(questionIndex: number): boolean {
    const options = this.getQuestionOptions(questionIndex);
    return options.controls.some(opt => {
      const text = opt.get('optionText')?.value;
      return !text || !text.trim();
    });
  }
}