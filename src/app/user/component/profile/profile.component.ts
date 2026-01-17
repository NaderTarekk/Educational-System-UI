// src/app/pages/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../auth/components/auth-service';
import { UsersService } from '../../../user/services/users.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: any | null = null;
  role: any;
  isLoading = true;
  isOwnProfile = true;
  activeTab: 'info' | 'groups' | 'subjects' = 'info';

  stats = {
    totalGroups: 0,
    totalSubjects: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.role = localStorage.getItem("NHC_PL_Role");

  }

  loadProfile(): void {
    this.isLoading = true;
    
    const userId = this.route.snapshot.paramMap.get('id') || this.authService.getCurrentUserId();
    
    if (!userId) {
      this.toastr.error('لم يتم العثور على معرف المستخدم', 'خطأ');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isOwnProfile = userId === this.authService.getCurrentUserId();

    this.usersService.getUserById().subscribe({
      next: (response: any) => {
        console.log(response.data);
        
        if (response.success && response.data) {
          this.user = response.data;
          this.calculateStats();
        } else {
          this.toastr.error(response.message || 'فشل تحميل البيانات', 'خطأ');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading profile:', error);
        this.toastr.error('حدث خطأ أثناء تحميل الملف الشخصي', 'خطأ');
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    if (this.user) {
      this.stats.totalGroups = this.user.userGroups?.length || 0;
      this.stats.totalSubjects = this.user.userSubjects?.length || 0;
    }
  }

  // ✅ إرجاع اسم الصلاحية بالعربي
  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      'Admin': 'مدير النظام',
      'Assistant': 'مساعد',
      'Student': 'طالب',
      'Teacher': 'معلم'
    };
    return roles[role] || role;
  }

  // ✅ إرجاع أيقونة الصلاحية
  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'Admin': 'fa-user-shield',
      'Assistant': 'fa-user-tie',
      'Student': 'fa-user-graduate',
      'Teacher': 'fa-chalkboard-teacher'
    };
    return icons[role] || 'fa-user';
  }

  // ✅ إرجاع Gradient Style مباشرة (الحل الصحيح)
  getGradientStyle(role: string): string {
    const gradients: { [key: string]: string } = {
      'Admin': 'linear-gradient(135deg, #ef4444, #ec4899)',
      'Assistant': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      'Student': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      'Teacher': 'linear-gradient(135deg, #22c55e, #14b8a6)'
    };
    return gradients[role] || 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
  }

  // ✅ إرجاع أول حرف من الاسم
  getInitials(): string {
    if (this.user) {
      const first = this.user.firstName?.charAt(0) || '';
      const last = this.user.lastName?.charAt(0) || '';
      return first + last;
    }
    return 'U';
  }

  // ✅ تغيير التاب
  setActiveTab(tab: 'info' | 'groups' | 'subjects'): void {
    this.activeTab = tab;
  }

  // ✅ نسخ للـ Clipboard
  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toastr.success('تم النسخ بنجاح', 'نجاح');
    }).catch(() => {
      this.toastr.error('فشل النسخ', 'خطأ');
    });
  }

  // ✅ الرجوع
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}