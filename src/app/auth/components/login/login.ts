import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth-service';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  showPassword: boolean = false;
  loader: boolean = false;
  rememberMe: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private toastr: ToastrService, 
    private authService: AuthService, 
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // التحقق إذا كان المستخدم مسجل دخول بالفعل
    const token = localStorage.getItem('NHC_PL_Token');
    if (token && this.authService.isTokenValid()) {
      this.toastr.info('أنت مسجل دخول بالفعل');
      this.router.navigate(['']);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // تمييز الحقول غير الصالحة
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      this.toastr.error('تحقق من البيانات المدخلة', 'تسجيل الدخول');
      return;
    }

    this.loader = true;

    const loginData = {
      email: this.form.value.email.trim().toLowerCase(),
      password: this.form.value.password
    };

    this.authService.Login(loginData).subscribe({
      next: (res: any) => {
        this.loader = false;

        if (res.success === false) {
          this.toastr.error(res.message, 'تسجيل الدخول');
          // Add shake effect to form
          const card = document.querySelector('.glass-card');
          card?.classList.add('shake');
          setTimeout(() => card?.classList.remove('shake'), 500);
          return;
        }

        // حفظ البيانات
        localStorage.setItem('NHC_PL_Token', res.token);
        localStorage.setItem('NHC_PL_RefreshToken', res.refreshToken);
        localStorage.setItem('NHC_PL_Role', res.role);

        // Remember Me
        if (this.rememberMe) {
          localStorage.setItem('NHC_PL_RememberEmail', this.form.value.email);
        } else {
          localStorage.removeItem('NHC_PL_RememberEmail');
        }

        this.toastr.success('تم تسجيل الدخول بنجاح! ✨', 'مرحباً بك');
        
        // التوجيه حسب الدور
        this.navigateByRole(res.role);
      },
      error: (err) => {
        this.loader = false;
        console.error('Login error:', err);
        
        if (err.error?.message) {
          this.toastr.error(err.error.message, 'خطأ');
        } else {
          this.toastr.error('تحقق من البيانات المدخلة', 'تسجيل الدخول');
        }
      }
    });
  }

  // التوجيه حسب دور المستخدم
  private navigateByRole(role: string): void {
    switch (role?.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'student':
      default:
        this.router.navigate(['']);
        break;
    }
  }
}
