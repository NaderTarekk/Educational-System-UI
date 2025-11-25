import { Component, OnInit, ViewChild } from '@angular/core';
import { User } from '../../../models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  allUsers: User[] = [];
  isDialogOpen = false;
  isEditMode = false;
  userForm: FormGroup;
  selectedUserId: string | null = null;
  searchTerm = '';
  selectedRole = 'all';
  isLoading = false;
  isDeleteDialogOpen = false;
  userToDelete: User | null = null;
  isViewDialogOpen = false;
  viewedUser: User | null = null;
  isLoadingUserDetails = false;
  userRole: any;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  pageSizeOptions = [5, 10, 25, 50, 100];

  roles = [
    { value: 'Student', label: 'طالب', color: 'blue' },
    { value: 'Assistant', label: 'مساعد', color: 'green' },
    { value: 'Admin', label: 'مدير', color: 'purple' }
  ];

  groups: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private userService: UsersService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: [''],
      role: ['Student', Validators.required],
      groupIds: [[]] // Changed to array for multiple groups
    });
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem("NHC_PL_Role");
    this.loadGroups();
    this.loadUsers();
  }

  loadGroups(): void {
    this.userService.getAllGroups().subscribe((res: any) => {
      this.groups = res.data;
    });
  }

  loadUsers(pageNumber: number = 1, pageSize: number = this.pageSize): void {
    this.isLoading = true;
    this.userService.getAllUsers(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data;
          this.allUsers = response.allUsers;
          this.totalCount = response.totalCount;
          this.pageNumber = response.pageNumber;
          this.pageSize = response.pageSize;
          this.applyFiltersAndPagination();
        } else {
          this.showError(response.message);
        }
        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 401) {
          localStorage.removeItem('NHC_PL_Token');
          localStorage.removeItem('NHC_PL_Role');
          this.toastr.info("قم بتسجيل الدخول اولا");
          this.router.navigate(['/auth/login']);
        } else if (error.status === 403) {
          this.toastr.warning("ليس لديك صلاحية للوصول إلى هذا الجزء من النظام.");
          this.router.navigate(["/"]);
        } else {
          console.log(error);
          
          this.showError(error.error?.message || 'حدث خطأ أثناء تحميل المستخدمين');
        }
        this.isLoading = false;
      }
    });
  }

  applyFiltersAndPagination(): void {
    let filtered = [...this.allUsers];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.userName && user.userName.toLowerCase().includes(search))
      );
    }

    if (this.selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    this.totalCount = filtered.length;

    const startIndex = (this.pageNumber - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.users = filtered.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.pageNumber = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.applyFiltersAndPagination();
  }

  onRoleChange(event: any): void {
    this.selectedRole = event.target.value;
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

  get adminsCount(): number {
    return this.allUsers.filter(u => u.role === 'Admin').length;
  }

  get studentsCount(): number {
    return this.allUsers.filter(u => u.role === 'Student').length;
  }

  get assistantsCount(): number {
    return this.allUsers.filter(u => u.role === 'Assistant').length;
  }

  get filteredUsers(): User[] {
    return this.users;
  }

  openDialog(user?: User): void {
    this.isDialogOpen = true;
    document.body.style.overflow = 'hidden';

    if (user) {
      this.isEditMode = true;
      this.selectedUserId = user.id || null;
      
      // Extract group IDs from userGroups
      const groupIds = user.userGroups?.map(ug => ug.groupId) || [];
      
      this.userForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        groupIds: groupIds // Set multiple groups
      });
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.setValue('');
    } else {
      this.isEditMode = false;
      this.selectedUserId = null;
      this.userForm.reset({ role: 'Student', groupIds: [] });
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.userForm.get('password')?.updateValueAndValidity();
  }

  closeDialog(): void {
    this.isDialogOpen = false;
    document.body.style.overflow = 'auto';
    this.userForm.reset({ role: 'Student', groupIds: [] });
    this.isEditMode = false;
    this.selectedUserId = null;
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.closeDialog();
    }
  }

  checkValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    const wrapper = input.closest('.input-wrapper');
    if (input.value.trim() !== '') {
      wrapper?.classList.add('has-value');
    } else {
      wrapper?.classList.remove('has-value');
    }
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const userData: User = {
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      email: this.userForm.value.email,
      phoneNumber: this.userForm.value.phoneNumber,
      password: this.userForm.value.password,
      role: this.userForm.value.role,
      groupIds: this.userForm.value.groupIds || [] // Send array of group IDs
    };

    if (this.isEditMode && this.selectedUserId) {
      this.userService.updateUser(this.selectedUserId, userData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message);
            this.closeDialog();
            this.loadUsers();
          } else {
            this.showError(response.message);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.showError('حدث خطأ أثناء تحديث المستخدم');
          this.isLoading = false;
        }
      });
    } else {
      this.userService.addUser(userData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message);
            this.closeDialog();
            this.loadUsers();
          } else {
            this.showError(response.message);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error adding user:', error);
          this.showError('حدث خطأ أثناء إضافة المستخدم');
          this.isLoading = false;
        }
      });
    }
  }

  viewUser(id: string): void {
    this.isLoadingUserDetails = true;
    this.isViewDialogOpen = true;
    document.body.style.overflow = 'hidden';

    this.userService.getUserById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.viewedUser = response.data;
        } else {
          this.showError(response.message);
          this.closeViewDialog();
        }
        this.isLoadingUserDetails = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.showError('حدث خطأ أثناء تحميل بيانات المستخدم');
        this.closeViewDialog();
        this.isLoadingUserDetails = false;
      }
    });
  }

  closeViewDialog(): void {
    this.isViewDialogOpen = false;
    this.viewedUser = null;
    document.body.style.overflow = 'auto';
  }

  // Get multiple group names
  getGroupNames(user: User): string {
    if (!user.userGroups || user.userGroups.length === 0) {
      return 'غير منتمي لأي مجموعة';
    }
    
    const groupNames = user.userGroups
      .map(ug => {
        const group = this.groups.find(g => g.id === ug.groupId);
        return group ? group.name : 'مجموعة غير معروفة';
      })
      .join(', ');
      
    return groupNames;
  }

  // Get single group name (for backward compatibility)
  getGroupName(groupId?: string): string {
    if (!groupId) return 'غير منتمي لأي مجموعة';
    const group = this.groups.find(g => g.id === groupId);
    return group ? group.name : 'مجموعة غير معروفة';
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'Student': 'fa-user-graduate',
      'Assistant': 'fa-chalkboard-teacher',
      'Admin': 'fa-user-shield'
    };
    return icons[role] || 'fa-user';
  }

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'Student': 'from-blue-500 to-blue-600',
      'Assistant': 'from-green-500 to-green-600',
      'Admin': 'from-purple-500 to-purple-600'
    };
    return classes[role] || 'from-gray-500 to-gray-600';
  }

  openDeleteDialog(user: User): void {
    this.userToDelete = user;
    this.isDeleteDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.userToDelete = null;
    document.body.style.overflow = 'auto';
  }

  confirmDelete(): void {
    if (this.userToDelete && this.userToDelete.id) {
      this.isLoading = true;
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message);
            this.closeDeleteDialog();
            this.loadUsers();
          } else {
            this.showError(response.message);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.showError('حدث خطأ أثناء حذف المستخدم');
          this.isLoading = false;
        }
      });
    }
  }

  getRoleColor(role: string): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj?.color || 'gray';
  }

  getRoleLabel(role: string): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj?.label || role;
  }

  private showSuccess(message: string): void {
    this.toastr.success(message);
  }

  private showError(message: string): void {
    this.toastr.error(message);
  }
}