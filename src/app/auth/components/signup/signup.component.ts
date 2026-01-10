import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../auth-service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  form: FormGroup;
  loader: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  passwordStrength: string = '';
  passwordStrengthText: string = '';

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      thirdName: ['', [Validators.required, Validators.minLength(2)]],
      fourthName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // التحقق إذا كان المستخدم مسجل دخول بالفعل
    const token = localStorage.getItem('NHC_PL_Token');
    if (token) {
      this.toastr.info('أنت مسجل دخول بالفعل');
      this.router.navigate(['']);
    }
  }

  // التحقق من تطابق كلمة المرور
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // فحص قوة كلمة المرور
  checkPasswordStrength(): void {
    const password = this.form.get('password')?.value || '';
    let strength = 0;

    // طول كلمة المرور
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;

    // أحرف كبيرة
    if (/[A-Z]/.test(password)) strength++;

    // أحرف صغيرة
    if (/[a-z]/.test(password)) strength++;

    // أرقام
    if (/[0-9]/.test(password)) strength++;

    // رموز خاصة
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // تحديد مستوى القوة
    if (strength <= 2) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = 'ضعيفة';
    } else if (strength <= 3) {
      this.passwordStrength = 'fair';
      this.passwordStrengthText = 'متوسطة';
    } else if (strength <= 4) {
      this.passwordStrength = 'good';
      this.passwordStrengthText = 'جيدة';
    } else {
      this.passwordStrength = 'strong';
      this.passwordStrengthText = 'قوية';
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // تمييز الحقول غير الصالحة
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      this.toastr.error('يرجى ملء جميع الحقول بشكل صحيح', 'خطأ');
      return;
    }

    this.loader = true;

    const registerData = {
      firstName: this.form.value.firstName.trim(),
      lastName: this.form.value.lastName.trim(),
      thirdName: this.form.value.thirdName.trim(),
      fourthName: this.form.value.fourthName.trim(),
      email: this.form.value.email.trim().toLowerCase(),
      phoneNumber: this.form.value.phoneNumber.trim(),
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword,
      role: 'Student' // أو يمكنك إضافة حقل لاختيار النوع
    };

    this.authService.Register(registerData).subscribe({
      next: (res: any) => {
        this.loader = false;
        
        if (res.success === false) {
          this.toastr.error(res.message, 'خطأ في التسجيل');
          return;
        }

        this.toastr.success('تم إنشاء حسابك بنجاح! 🎉', 'مرحباً بك');
        
        // حفظ التوكن إذا تم إرجاعه
        if (res.token) {
          localStorage.setItem('NHC_PL_Token', res.token);
          localStorage.setItem('NHC_PL_Role', res.role || 'Student');
          this.router.navigate(['']);
        } else {
          // التوجيه لصفحة تسجيل الدخول
          this.router.navigate(['/auth/login']);
        }
      },
      error: (err) => {
        this.loader = false;
        console.error('Registration error:', err);
        
        if (err.error?.message) {
          this.toastr.error(err.error.message, 'خطأ في التسجيل');
        } else if (err.error?.errors) {
          const errorMessages = Object.values(err.error.errors).flat().join(', ');
          this.toastr.error(errorMessages, 'خطأ في البيانات');
        } else {
          this.toastr.error('حدث خطأ أثناء إنشاء الحساب', 'خطأ');
        }
      }
    });
  }

}
