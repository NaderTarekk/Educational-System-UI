import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../auth-service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

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
      thirdName: [''],
      fourthName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const token = localStorage.getItem('NHC_PL_Token');
    if (token) {
      this.toastr.info('أنت مسجل دخول بالفعل');
      this.router.navigate(['']);
    }
  }

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

  checkPasswordStrength(): void {
    const password = this.form.get('password')?.value || '';
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

  onSubmit(): void {
    if (this.form.invalid) {
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
      role: 'Student'
    };

    this.authService.Register(registerData).subscribe({
      next: async (res: any) => {
        this.loader = false;

        if (res.success === false) {
          this.toastr.error(res.message, 'خطأ في التسجيل');
          return;
        }

        this.toastr.success('تم إنشاء حسابك بنجاح! 🎉', 'مرحباً بك');

        if (res.token) {
          localStorage.setItem('NHC_PL_Token', res.token);
          localStorage.setItem('NHC_PL_Role', res.role || 'Student');
        }

        // 🆕 توليد بطاقة الطالب PDF
        try {
          this.toastr.info('جاري إنشاء بطاقتك الطلابية...', '📄 بطاقة الطالب', {
            timeOut: 3000
          });

          // 🔧 استخراج User ID بطرق متعددة
          let userId = '';

          // طريقة 1: من user object مباشرة
          if (res.user?.id) {
            userId = res.user.id;
          }
          // طريقة 2: من الـ Token
          else if (res.token) {
            userId = this.extractUserIdFromToken(res.token);
          }
          // طريقة 3: استخدم الإيميل كبديل مؤقت
          else {
            userId = registerData.email;
          }

          const userData = {
            id: userId,
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            thirdName: registerData.thirdName,
            fourthName: registerData.fourthName,
            email: registerData.email,
            phoneNumber: registerData.phoneNumber,
            role: res.role || 'Student'
          };

          console.log('📄 Generating PDF with data:', userData);

          await this.generateStudentCardPDF(userData);

          this.toastr.success('تم تحميل بطاقتك الطلابية بنجاح! 🎓', 'بطاقة الطالب', {
            timeOut: 5000
          });
        } catch (pdfError) {
          console.error('❌ Error generating student card:', pdfError);
          this.toastr.warning('تم التسجيل بنجاح ولكن حدث خطأ في إنشاء البطاقة', 'تنبيه');
        }

        // التوجيه للصفحة الرئيسية
        setTimeout(() => {
          if (res.token) {
            this.router.navigate(['']);
          } else {
            this.router.navigate(['/auth/login']);
          }
        }, 3000);
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

  async generateStudentCardPDF(user: any): Promise<void> {
    try {
      console.log('🎨 Starting PDF generation...');

      if (!user.id) {
        console.error('❌ No user ID found!');
        throw new Error('User ID is missing');
      }

      // 1️⃣ إنشاء QR Code
      console.log('📊 Generating QR Code for ID:', user.id);

      const qrCodeDataUrl = await QRCode.toDataURL(user.id, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('✅ QR Code generated successfully');

      // 2️⃣ إنشاء محتوى PDF
      const pdfContent = document.createElement('div');

      // ✅ إخفاء العنصر خارج الشاشة
      pdfContent.style.position = 'absolute';
      pdfContent.style.top = '-10000px';
      pdfContent.style.left = '-10000px';
      pdfContent.style.width = '210mm';
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.direction = 'rtl';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.zIndex = '-9999';

      pdfContent.innerHTML = `
      <!-- Header -->
      <div style="text-align: center; ">
        <h1 style="color: #3B82F6; font-size: 32px; margin-bottom: 5px; font-weight: bold;">بطاقة الطالب</h1>
        <p style="color: #06B6D4; font-size: 14px; margin: 5px 0;">Student Card</p>
        <div style="width: 100%; height: 3px; background: linear-gradient(to right, #3B82F6, #06B6D4); margin: 10px 0;"></div>
      </div>

      <!-- Student Info Section -->
      <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; ">
        <!-- Full Name -->
        <div style="margin-bottom: 10px; text-align: center;">
          <p style="font-size: 12px; color: #6B7280; font-weight: bold; margin: 0;">الاسم الكامل</p>
          <p style="font-size: 28px; color: #1E40AF; font-weight: bold; margin: 10px 0;">
            ${user.firstName} ${user.lastName} ${user.thirdName || ''} ${user.fourthName || ''}
          </p>
        </div>

        <!-- Info Table -->
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; font-weight: bold; background: #DBEAFE; border: 1px solid #93C5FD; width: 150px;">رقم الطالب:</td>
            <td style="padding: 12px; background: white; border: 1px solid #93C5FD; color: #374151; font-size: 11px; direction: ltr; text-align: left;">${user.id || ''}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; background: #DBEAFE; border: 1px solid #93C5FD;">البريد الإلكتروني:</td>
            <td style="padding: 12px; background: white; border: 1px solid #93C5FD; color: #374151; font-size: 11px; direction: ltr; text-align: left;">${user.email || ''}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; background: #DBEAFE; border: 1px solid #93C5FD;">رقم الجوال:</td>
            <td style="padding: 12px; background: white; border: 1px solid #93C5FD; color: #374151; font-size: 11px; direction: ltr; text-align: left;">${user.phoneNumber || ''}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; background: #DBEAFE; border: 1px solid #93C5FD;">الصفة:</td>
            <td style="padding: 12px; background: white; border: 1px solid #93C5FD; color: #374151;">${this.getArabicRole(user.role)}</td>
          </tr>
        </table>
      </div>

      <!-- QR Code Section -->
      <div style="text-align: center; ">
        <h2 style="color: #0891B2; font-size: 18px;  font-weight: bold;margin-bottom: 10px;">رمز الطالب - Student Code</h2>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 20px; background: white; border: 2px solid #3B82F6; border-radius: 10px; max-width: 280px; margin: 0 auto;">
          <div style="width: 200px; height: 200px; background: white; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <img id="qrcodeImage" src="${qrCodeDataUrl}" style="width: 100%; height: 100%; display: block; image-rendering: crisp-edges;" alt="QR Code" />
          </div>
          <p style="font-size: 11px; font-weight: bold; color: #374151; margin: 15px 0 5px 0; direction: ltr; word-break: break-all; max-width: 220px;">${user.id}</p>
        </div>
        <p style="margin-top: 10px; font-size: 10px; color: #9CA3AF;">امسح الكود للتحقق من هوية الطالب</p>
      </div>

      <!-- Terms & Conditions -->
      <div style="margin-bottom: 12px;">
        <h2 style="color: #0891B2; font-size: 16px;  font-weight: bold; margin-bottom: 7px;">📌 شروط استخدام البطاقة</h2>
        <div style="background: #F9FAFB; padding: 15px; border-radius: 10px; border-right: 4px solid #3B82F6;">
          <ul style="margin: 0; padding-right: 20px; line-height: 1.8;">
            <li style="font-size: 10px; color: #374151; ">هذه البطاقة ملك للنظام التعليمي ويجب إعادتها عند الطلب</li>
            <li style="font-size: 10px; color: #374151; ">يجب حمل البطاقة في جميع الأوقات داخل المؤسسة التعليمية</li>
            <li style="font-size: 10px; color: #374151; ">في حالة الفقدان أو التلف يرجى الإبلاغ فوراً لإصدار بطاقة بديلة</li>
            <li style="font-size: 10px; color: #374151; ">لا يسمح بنقل البطاقة أو إعارتها لشخص آخر</li>
            <li style="font-size: 10px; color: #374151;">استخدام البطاقة للأغراض التعليمية فقط</li>
          </ul>
        </div>
      </div>

      <!-- Contact Info -->
      <div style="background: #EFF6FF; padding: 15px; border-radius: 10px; ">
        <h3 style="color: #1E40AF; font-size: 14px;  font-weight: bold;">📞 للاستفسارات والدعم الفني</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
          <div>
            <p style="font-size: 10px; color: #6B7280; margin: 0;">📧 البريد الإلكتروني</p>
            <p style="font-size: 9px; color: #1E40AF; margin: 5px 0 0 0; direction: ltr;">support@educational-system.com</p>
          </div>
          <div>
            <p style="font-size: 10px; color: #6B7280; margin: 0;">☎️ الهاتف</p>
            <p style="font-size: 9px; color: #1E40AF; margin: 5px 0 0 0; direction: ltr;">+966 XX XXX XXXX</p>
          </div>
          <div>
            <p style="font-size: 10px; color: #6B7280; margin: 0;">🌐 الموقع الإلكتروني</p>
            <p style="font-size: 9px; color: #1E40AF; margin: 5px 0 0 0; direction: ltr;">www.educational-system.com</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #D1D5DB; padding-top: 15px; text-align: center;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 9px; color: #6B7280;">
          <div style="text-align: right;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
          <div>النظام التعليمي - Educational System</div>
          <div style="text-align: left;">جميع الحقوق محفوظة © 2025</div>
        </div>
      </div>
    `;

      // 3️⃣ إضافة المحتوى للـ DOM
      console.log('🖼️ Adding content to DOM...');
      document.body.appendChild(pdfContent);

      // ✅ انتظار تحميل صورة QR Code بشكل صحيح
      const qrImage = pdfContent.querySelector('#qrcodeImage') as HTMLImageElement;
      if (qrImage) {
        await new Promise<void>((resolve) => {
          if (qrImage.complete && qrImage.naturalHeight !== 0) {
            console.log('✅ QR image already loaded');
            resolve();
          } else {
            qrImage.onload = () => {
              console.log('✅ QR image loaded successfully');
              resolve();
            };
            qrImage.onerror = (err) => {
              console.error('❌ QR image failed to load', err);
              resolve();
            };
            // Timeout fallback
            setTimeout(() => {
              console.log('⚠️ QR image load timeout, continuing anyway');
              resolve();
            }, 2000);
          }
        });
      }

      // انتظار إضافي للـ rendering الكامل
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4️⃣ تحويل لـ Canvas
      console.log('🎨 Converting to canvas...');
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: pdfContent.scrollWidth,
        windowHeight: pdfContent.scrollHeight
      });
      console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);

      // 5️⃣ إزالة المحتوى من الـ DOM
      document.body.removeChild(pdfContent);

      // 6️⃣ إنشاء PDF
      console.log('📄 Creating PDF...');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 7️⃣ حفظ الملف
      const fileName = `بطاقة_الطالب_${user.firstName}_${user.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('💾 Saving PDF as:', fileName);
      pdf.save(fileName);
      console.log('✅ PDF saved successfully!');

    } catch (error) {
      console.error('❌ Error in generateStudentCardPDF:', error);
      throw error;
    }
  }

  private extractUserIdFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token Payload:', payload);

      // جرب كل الاحتمالات
      const possibleIds = [
        payload.id,
        payload.Id,
        payload.ID,
        payload.sub,
        payload.nameid,
        payload.userId,
        payload.UserId,
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      ];

      for (const id of possibleIds) {
        if (id) {
          console.log('✅ Found ID in token:', id);
          return id;
        }
      }

      console.warn('⚠️ Could not find ID in token');
      return '';
    } catch (error) {
      console.error('❌ Error extracting ID from token:', error);
      return '';
    }
  }

  private getArabicRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'Student': 'طالب',
      'Teacher': 'معلم',
      'Assistant': 'مساعد',
      'Admin': 'مدير'
    };
    return roleMap[role] || role || 'غير محدد';
  }
}