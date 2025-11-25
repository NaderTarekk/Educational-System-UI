import { Component, OnInit, ViewChild } from '@angular/core';
import { Exam, CreateExamDto, UpdateExamDto } from '../../../models/Exam.model';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ExamsService } from '../../services/exams.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { HttpHeaders } from '@angular/common/http';

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
  viewedExam: Exam | null = null;
  isLoadingExamDetails = false;
  userRole: any;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  pageSizeOptions = [5, 10, 25, 50, 100];

  groups: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private examService: ExamsService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router
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
    // إذا كان عندك service للـ Groups استخدمه
    // مثال: this.groupService.getGroups()

    // أو استخدم service آخر إذا كان موجود
    // في حالة عدم وجود service، يمكنك استخدام API call مباشر:

    // حل مؤقت: استخدم HTTP Client مباشرة أو اترك المصفوفة فارغة
    // يمكنك استبدال هذا بالـ service الصحيح

    // مثال باستخدام HTTP مباشر:
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('NHC_PL_Token')}`
    });

    // استبدل الـ URL بالـ endpoint الصحيح
    // this.http.get<any>('YOUR_GROUPS_API_URL', { headers }).subscribe({
    //   next: (response: any) => {
    //     if (response.success) {
    //       this.groups = response.data;
    //       console.log('Groups loaded:', this.groups); // للتأكد من البيانات
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error loading groups:', error);
    //   }
    // });

    // ⚠️ تحذير: هذه بيانات وهمية للتجربة فقط
    // استبدلها بـ API call حقيقي يرجع Groups بـ Guid صحيح
    // مثال: { id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", name: "المجموعة الأولى" }

    this.groups = [
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Guid صحيح
        name: 'المجموعة الأولى'
      },
      {
        id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', // Guid صحيح
        name: 'المجموعة الثانية'
      },
      {
        id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', // Guid صحيح
        name: 'المجموعة الثالثة'
      }
    ];

    console.log('⚠️ استخدام بيانات وهمية للمجموعات. استبدلها بـ API call حقيقي!');
    console.log('Groups:', this.groups);
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

  openDialog(exam?: Exam): void {
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

  addQuestion(): void {
    const questionForm = this.createQuestionForm();
    // Add 4 default options for multiple choice (default type is 0)
    const optionsArray = questionForm.get('options') as FormArray;
    for (let i = 0; i < 4; i++) {
      const option = this.createOptionForm();
      option.patchValue({
        order: i + 1,
        optionText: '' // Empty by default
      });
      optionsArray.push(option);
    }
    this.questions.push(questionForm);

    console.log('Question added. Total questions:', this.questions.length);
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
    // Update order for remaining questions
    this.questions.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  getQuestionOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addOption(questionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    const option = this.createOptionForm();
    option.patchValue({ order: options.length + 1 });
    options.push(option);
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    options.removeAt(optionIndex);
    // Update order for remaining options
    options.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  setCorrectOption(questionIndex: number, optionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    // Set all to false first
    options.controls.forEach((control, idx) => {
      control.patchValue({ isCorrect: false });
    });
    // Set selected to true
    options.at(optionIndex).patchValue({ isCorrect: true });

    console.log(`✅ Question ${questionIndex}, Option ${optionIndex} set as correct`);
    console.log('Options state:', options.value);
  }

  onQuestionTypeChange(questionIndex: number): void {
    const question = this.questions.at(questionIndex);
    const type = question.get('type')?.value;
    const options = this.getQuestionOptions(questionIndex);

    // Clear existing options
    while (options.length) {
      options.removeAt(0);
    }

    // Add options based on type
    if (type === 0) { // MultipleChoice
      // Add 4 empty options
      for (let i = 0; i < 4; i++) {
        const option = this.createOptionForm();
        option.patchValue({
          order: i + 1,
          optionText: '',
          isCorrect: false
        });
        options.push(option);
      }
    } else if (type === 1) { // TrueFalse
      // Add True option
      const trueOption = this.createOptionForm();
      trueOption.patchValue({
        optionText: 'صح',
        order: 1,
        isCorrect: false
      });
      options.push(trueOption);

      // Add False option
      const falseOption = this.createOptionForm();
      falseOption.patchValue({
        optionText: 'خطأ',
        order: 2,
        isCorrect: false
      });
      options.push(falseOption);
    }
    // Essay type (2) doesn't need options - array stays empty

    console.log(`Question ${questionIndex} type changed to ${type}. Options count: ${options.length}`);
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

  saveExam(): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.examForm.value;

    if (this.isEditMode && this.selectedExamId) {
      // Update Exam
      const updateData: UpdateExamDto = {
        id: this.selectedExamId,
        title: formValue.title,
        description: formValue.description,
        groupId: formValue.groupId, // Already a Guid string
        duration: Number(formValue.duration),
        totalMarks: Number(formValue.totalMarks),
        passingMarks: Number(formValue.passingMarks),
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate),
        isActive: formValue.isActive
      };

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
          console.error('Error updating exam:', error);
          this.showError('حدث خطأ أثناء تحديث الامتحان');
          this.isLoading = false;
        }
      });
    } else {
      // Create Exam with Questions
      // Build questions array matching ExamDto.Questions (NOT Question entity)
      const questionsData = formValue.questions && formValue.questions.length > 0
        ? formValue.questions
          .filter((q: any) => q.questionText && q.questionText.trim()) // Only include questions with text
          .map((q: any, index: number) => {
            // Build QuestionDto (NOT Question entity - no examId, no Exam navigation)
            const questionDto: any = {
              id: '00000000-0000-0000-0000-000000000000', // Backend will generate
              questionText: q.questionText.trim(),
              type: Number(q.type),
              marks: Number(q.marks),
              order: index + 1,
              options: [] // Initialize as empty array
            };

            // Add options only if question type needs them
            if (q.type !== 2 && q.options && q.options.length > 0) {
              // Build QuestionOptionDto (NOT QuestionOption entity - no questionId, no Question navigation)
              questionDto.options = q.options
                .filter((opt: any) => opt.optionText && opt.optionText.trim()) // Filter empty options
                .map((opt: any, optIndex: number) => ({
                  id: '00000000-0000-0000-0000-000000000000', // Backend will generate
                  optionText: opt.optionText.trim(),
                  isCorrect: Boolean(opt.isCorrect),
                  order: optIndex + 1
                  // NO questionId - DTOs don't have it
                  // NO Question navigation property
                }));
            }

            return questionDto;
          })
        : [];

      // Build ExamDto (NOT Exam entity - has questionsCount, no createdBy)
      const createData: any = {
        id: '00000000-0000-0000-0000-000000000000', // Backend will generate
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        groupId: "9eaf721b-64be-4500-4c82-08de2445d047",
        duration: Number(formValue.duration),
        totalMarks: Number(formValue.totalMarks),
        passingMarks: Number(formValue.passingMarks),
        startDate: new Date(formValue.startDate).toISOString(),
        endDate: new Date(formValue.endDate).toISOString(),
        isActive: Boolean(formValue.isActive),
        createdAt: new Date().toISOString(),
        questionsCount: questionsData.length,
        questions: questionsData
        // NO createdBy - ExamDto doesn't have it
        // NO Group navigation property
      };

      console.log('📤 Sending ExamDto:', createData);
      console.log('📊 Questions count:', questionsData.length);
      if (questionsData.length > 0) {
        console.log('📝 First QuestionDto:', questionsData[0]);
        if (questionsData[0].options && questionsData[0].options.length > 0) {
          console.log('📋 First question options:', questionsData[0].options);
        }
      }

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
          console.error('❌ Error creating exam:', error);
          console.error('❌ Error details:', error.error);

          // Show validation errors if available
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
        console.error('Error loading exam:', error);
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
          console.error('Error deleting exam:', error);
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
      console.error(error);
      this.showError(error.error?.message || 'حدث خطأ أثناء تحميل الامتحانات');
    }
  }

  private showSuccess(message: string): void {
    this.toastr.success(message);
  }

  private showError(message: string): void {
    this.toastr.error(message);
  }
}