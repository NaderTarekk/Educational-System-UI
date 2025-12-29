// src/app/pages/subjects/subjects.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/components/auth-service';
import { Subject, CreateSubjectDto, UserSubject, AssignUsersDto } from '../../../models/subject.model';
import { ToastrService } from 'ngx-toastr';
import { SubjectsService } from '../../services/subject.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment';
import { UsersService } from '../../../user/services/users.service';

@Component({
  selector: 'app-subjects',
  standalone: false,
  templateUrl: './subject.component.html',
  styleUrl: './subjects.component.scss'
})
export class SubjectsComponent implements OnInit {
  availableUsers: any[] = []; // كل المستخدمين المتاحين
  selectedUserIds: string[] = [];
  isLoadingAvailableUsers = false;
  filteredAvailableUsers: any[] = [];
  userSearchText = '';

  // Data
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  subjectUsers: UserSubject[] = [];
  selectedSubject: Subject | null = null;

  // Stats
  stats = {
    totalSubjects: 0,
    activeSubjects: 0,
    inactiveSubjects: 0,
    totalEnrollments: 0
  };

  // Form
  subjectForm!: FormGroup;

  // UI State
  showModal = false;
  showUsersModal = false;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  isLoadingUsers = false;

  // Filters
  searchText = '';
  selectedFilter = 'all';

  // User
  userRole = '';

  // ✅ Dialog States
  isDeleteDialogOpen = false;
  isDeleteUserDialogOpen = false;
  subjectToDelete: Subject | null = null;
  userToRemove: UserSubject | null = null;
  isDeleting = false;

  constructor(
    private fb: FormBuilder,
    private subjectsService: SubjectsService,
    private authService: AuthService,
    private toastr: ToastrService,
    private http: HttpClient
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.userRole = this.authService.getCurrentUserRole();
    this.loadSubjects();
    this.loadStats();
  }

  // ========== Form Initialization ==========

  initForm() {
    this.subjectForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      description: [''],
      code: [''],
      color: ['#6366f1'],
      icon: ['fas fa-book'],
      isActive: [true]
    });
  }

  // ========== Data Loading ==========

  loadSubjects() {
    this.isLoading = true;

    this.subjectsService.getAllSubjects().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subjects = response.data;
          this.filteredSubjects = this.subjects;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading subjects:', error);
        this.toastr.error('فشل تحميل المواد');
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.subjectsService.getStats().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading stats:', error);
      }
    });
  }

  // ========== Filtering & Search ==========

  filterSubjects(filter: string) {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.subjects];

    // Filter by status
    if (this.selectedFilter === 'active') {
      filtered = filtered.filter(s => s.isActive);
    } else if (this.selectedFilter === 'inactive') {
      filtered = filtered.filter(s => !s.isActive);
    }

    // Filter by search text
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.code?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search)
      );
    }

    this.filteredSubjects = filtered;
  }

  // ========== CRUD Operations ==========

  openAddModal() {
    this.isEditMode = false;
    this.subjectForm.reset({
      color: '#6366f1',
      icon: 'fas fa-book',
      isActive: true
    });
    this.showModal = true;
  }

  openEditModal(subject: Subject) {
    this.isEditMode = true;
    this.selectedSubject = subject;
    this.subjectForm.patchValue(subject);
    this.showModal = true;

    // ✅ جلب المستخدمين المتاحين والمستخدمين الحاليين للمادة
    this.loadAvailableUsers();
    this.loadCurrentSubjectUsers(subject.id);
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.includes(userId);
  }

  // ✅ Toggle User Selection
  toggleUserSelection(userId: string) {
    const index = this.selectedUserIds.indexOf(userId);
    if (index > -1) {
      // إزالة
      this.selectedUserIds.splice(index, 1);
    } else {
      // إضافة
      this.selectedUserIds.push(userId);
    }
  }

  onUserSearch() {
    if (!this.userSearchText.trim()) {
      this.filteredAvailableUsers = [...this.availableUsers];
      return;
    }

    const search = this.userSearchText.toLowerCase();
    this.filteredAvailableUsers = this.availableUsers.filter(user =>
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.userName?.toLowerCase().includes(search)
    );
  }

  loadCurrentSubjectUsers(subjectId: string) {
    this.subjectsService.getSubjectUsers(subjectId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // احفظ IDs المستخدمين الحاليين
          this.selectedUserIds = response.data.map((u: any) => u.userId);
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading current users:', error);
      }
    });
  }

  // ✅ جلب كل المستخدمين المتاحين
  loadAvailableUsers() {
    this.isLoadingAvailableUsers = true;

    // استخدم الـ Users Service (لازم تعمله)
    this.http.get<any>(`${environment.userUrl}`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('NHC_PL_Token')}`
      })
    }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // فلتر الطلاب والمدرسين بس
          this.availableUsers = response.data.filter((u: any) =>
            u.role === 'Student' || u.role === 'Assistant'
          );
          this.filteredAvailableUsers = [...this.availableUsers];
        }
        this.isLoadingAvailableUsers = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading users:', error);
        this.toastr.error('فشل تحميل المستخدمين');
        this.isLoadingAvailableUsers = false;
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.subjectForm.reset();
    this.userSearchText = ''; // ⬅️ إعادة تعيين البحث
    this.filteredAvailableUsers = [];
    this.availableUsers = [];
    this.selectedUserIds = [];
  }

  saveSubject() {
    if (this.subjectForm.invalid) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.isSaving = true;
    const dto: CreateSubjectDto = this.subjectForm.value;

    const operation = this.isEditMode
      ? this.subjectsService.updateSubject(dto)
      : this.subjectsService.createSubject(dto);

    operation.subscribe({
      next: (response: any) => {
        if (response.success) {
          // ✅ لو Edit Mode، حدّث المستخدمين
          if (this.isEditMode && this.selectedSubject) {
            this.updateSubjectUsers(this.selectedSubject.id);
          } else {
            this.toastr.success(response.message || 'تم الإضافة بنجاح');
            this.closeModal();
            this.loadSubjects();
            this.loadStats();
            this.isSaving = false;
          }
        } else {
          this.toastr.error(response.message || 'حدث خطأ');
          this.isSaving = false;
        }
      },
      error: (error: any) => {
        console.error('❌ Error saving subject:', error);
        this.toastr.error('فشل الحفظ');
        this.isSaving = false;
      }
    });
  }

  updateSubjectUsers(subjectId: string) {
    const assignDto: AssignUsersDto = {
      subjectId: subjectId,
      userIds: this.selectedUserIds
    };

    this.subjectsService.assignUsers(assignDto).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم التعديل بنجاح');
          this.closeModal();
          this.loadSubjects();
          this.loadStats();
        } else {
          this.toastr.error(response.message || 'فشل تحديث المستخدمين');
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('❌ Error updating users:', error);
        this.toastr.error('فشل تحديث المستخدمين');
        this.isSaving = false;
      }
    });
  }


  // ========== Users Management ==========

  viewSubjectUsers(subject: Subject) {
    this.selectedSubject = subject;
    this.isLoadingUsers = true;
    this.showUsersModal = true;

    this.subjectsService.getSubjectUsers(subject.id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subjectUsers = response.data;
        }
        this.isLoadingUsers = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading users:', error);
        this.toastr.error('فشل تحميل المستخدمين');
        this.isLoadingUsers = false;
      }
    });
  }

  closeUsersModal() {
    this.showUsersModal = false;
    this.selectedSubject = null;
    this.subjectUsers = [];
  }

  removeUserFromSubject(userId: string) {
    if (!this.selectedSubject || !confirm('هل أنت متأكد من إزالة هذا المستخدم؟')) {
      return;
    }

    this.subjectsService.removeUser(this.selectedSubject.id, userId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم إزالة المستخدم بنجاح');
          this.viewSubjectUsers(this.selectedSubject!);
        } else {
          this.toastr.error(response.message || 'فشل إزالة المستخدم');
        }
      },
      error: (error: any) => {
        console.error('❌ Error removing user:', error);
        this.toastr.error('فشل إزالة المستخدم');
      }
    });
  }

  // ========== Helper Methods ==========

  getRoleClass(role: string): string {
    const roleMap: any = {
      'Admin': 'admin',
      'Assistant': 'assistant',
      'Student': 'student'
    };
    return roleMap[role] || 'student';
  }

  getRoleText(role: string): string {
    const roleMap: any = {
      'Admin': 'مدير',
      'Assistant': 'مساعد',
      'Student': 'طالب'
    };
    return roleMap[role] || role;
  }

  // ✅ Delete Subject Dialog
  openDeleteDialog(subject: Subject) {
    this.subjectToDelete = subject;
    this.isDeleteDialogOpen = true;
  }

  closeDeleteDialog() {
    if (this.isDeleting) return;
    this.isDeleteDialogOpen = false;
    this.subjectToDelete = null;
  }

  confirmDeleteSubject() {
    if (!this.subjectToDelete) return;

    this.isDeleting = true;
    this.subjectsService.deleteSubject(this.subjectToDelete.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم الحذف بنجاح');
          this.loadSubjects();
          this.calculateStats();
        } else {
          this.toastr.error(response.message || 'فشل الحذف');
        }
        this.isDeleting = false;
        this.closeDeleteDialog();
      },
      error: (error: any) => {
        console.error('❌ Error deleting subject:', error);
        this.toastr.error('فشل الحذف');
        this.isDeleting = false;
        this.closeDeleteDialog();
      }
    });
  }

  // ✅ Remove User Dialog
  openRemoveUserDialog(user: UserSubject) {
    this.userToRemove = user;
    this.isDeleteUserDialogOpen = true;
  }

  closeRemoveUserDialog() {
    if (this.isDeleting) return;
    this.isDeleteUserDialogOpen = false;
    this.userToRemove = null;
  }

  confirmRemoveUser() {
    if (!this.selectedSubject || !this.userToRemove) return;

    this.isDeleting = true;
    this.subjectsService.removeUser(this.selectedSubject.id, this.userToRemove.userId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم إزالة المستخدم بنجاح');
          this.viewSubjectUsers(this.selectedSubject!);
        } else {
          this.toastr.error(response.message || 'فشل إزالة المستخدم');
        }
        this.isDeleting = false;
        this.closeRemoveUserDialog();
      },
      error: (error: any) => {
        console.error('❌ Error removing user:', error);
        this.toastr.error('فشل إزالة المستخدم');
        this.isDeleting = false;
        this.closeRemoveUserDialog();
      }
    });
  }
  // ✅ Helper methods للعداد
  getStudentsCount(): number {
    return this.subjectUsers.filter(u => u.role === 'Student').length;
  }

  getAssistantsCount(): number {
    return this.subjectUsers.filter(u => u.role === 'Assistant').length;
  }
  // ✅ احسب Stats
  calculateStats() {
    this.stats.totalSubjects = this.subjects.length;
    this.stats.activeSubjects = this.subjects.filter(s => s.isActive).length;
    this.stats.inactiveSubjects = this.subjects.filter(s => !s.isActive).length;
    this.stats.totalEnrollments = this.subjects.reduce((sum, s) => sum + (s.totalStudents || 0) + (s.totalTeachers || 0), 0);
  }
}