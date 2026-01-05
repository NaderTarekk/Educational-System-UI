import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { interval, Subscription, take } from 'rxjs';
import { AuthService } from '../auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInputs') otpInputs!: QueryList<ElementRef>;

  currentStep: number = 1;
  loader: boolean = false;
  userEmail: string = '';
  resetToken: string = '';
  
  // OTP
  otpValues: string[] = ['', '', '', '', '', ''];
  resendTimer: number = 60;
  timerSubscription?: Subscription;

  // Password
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  passwordStrength: string = '';
  passwordStrengthText: string = '';

  // Forms
  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authService: AuthService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Reset forms
    this.emailForm.reset();
    this.otpForm.reset();
    this.passwordForm.reset();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // Password Match Validator
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Step 1: Send Reset Code
  sendResetCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loader = true;
    this.userEmail = this.emailForm.value.email.trim().toLowerCase();

    this.authService.ForgotPassword(this.userEmail).subscribe({
      next: (res: any) => {
        this.loader = false;
        
        if (res.success === false) {
          this.toastr.error(res.message, 'خطأ');
          return;
        }

        this.toastr.success('تم إرسال كود التحقق بنجاح', 'نجاح');
        this.currentStep = 2;
        this.startResendTimer();

        // للتجربة فقط - يظهر الكود (احذف في Production)
        if (res.data?.code) {
          console.log('🔐 Reset Code:', res.data.code);
          this.toastr.info(`كود التجربة: ${res.data.code}`, 'للتجربة فقط', { timeOut: 10000 });
        }
      },
      error: (err) => {
        this.loader = false;
        console.error('Forgot password error:', err);
        this.toastr.error('حدث خطأ، يرجى المحاولة مرة أخرى', 'خطأ');
      }
    });
  }

  // Timer for resend
  startResendTimer(): void {
    this.resendTimer = 60;
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.timerSubscription = interval(1000)
      .pipe(take(60))
      .subscribe(() => {
        this.resendTimer--;
      });
  }

  // Resend Code
  resendCode(): void {
    this.sendResetCode();
  }

  // OTP Input Handling
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // السماح فقط بالأرقام
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    this.otpValues[index] = value;

    // الانتقال للحقل التالي
    if (value && index < 5) {
      const inputs = this.otpInputs.toArray();
      inputs[index + 1]?.nativeElement.focus();
    }

    // تحديث قيمة الـ Form
    this.otpForm.patchValue({ otp: this.otpValues.join('') });
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const inputs = this.otpInputs.toArray();

    // Backspace - الرجوع للحقل السابق
    if (event.key === 'Backspace' && !this.otpValues[index] && index > 0) {
      inputs[index - 1]?.nativeElement.focus();
    }

    // Arrow Keys
    if (event.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1]?.nativeElement.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      inputs[index + 1]?.nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      this.otpValues = digits.split('');
      this.otpForm.patchValue({ otp: digits });
      
      // تحديث الـ inputs
      const inputs = this.otpInputs.toArray();
      inputs.forEach((input, i) => {
        input.nativeElement.value = this.otpValues[i];
      });
      
      // التركيز على الحقل الأخير
      inputs[5]?.nativeElement.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpValues.every(v => v !== '');
  }

  // Step 2: Verify Code
  verifyCode(): void {
    if (!this.isOtpComplete()) {
      this.toastr.error('يرجى إدخال الكود كاملاً', 'خطأ');
      return;
    }

    this.loader = true;
    const code = this.otpValues.join('');

    this.authService.VerifyResetCode(this.userEmail, code).subscribe({
      next: (res: any) => {
        this.loader = false;

        if (res.success === false) {
          this.toastr.error(res.message, 'خطأ');
          // Add shake animation
          const otpContainer = document.querySelector('.otp-container');
          otpContainer?.classList.add('shake');
          setTimeout(() => otpContainer?.classList.remove('shake'), 500);
          return;
        }

        this.toastr.success('تم التحقق بنجاح', 'نجاح');
        this.resetToken = res.token;
        this.currentStep = 3;
      },
      error: (err) => {
        this.loader = false;
        console.error('Verify code error:', err);
        this.toastr.error('الكود غير صحيح', 'خطأ');
      }
    });
  }

  // Step 3: Reset Password
  resetPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loader = true;

    const resetData = {
      email: this.userEmail,
      token: this.resetToken,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.ResetPassword(resetData).subscribe({
      next: (res: any) => {
        this.loader = false;

        if (res.success === false) {
          this.toastr.error(res.message, 'خطأ');
          return;
        }

        this.toastr.success('تم تغيير كلمة المرور بنجاح', 'نجاح');
        this.currentStep = 4;
      },
      error: (err) => {
        this.loader = false;
        console.error('Reset password error:', err);
        this.toastr.error('حدث خطأ، يرجى المحاولة مرة أخرى', 'خطأ');
      }
    });
  }

  // Password Strength
  checkPasswordStrength(): void {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

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

  // Toggle Password Visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Go Back
  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
    }
  }

}
