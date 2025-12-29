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
  showPassword = false;
  loader: boolean = false;
  private refreshTimer: any;

  constructor(private fb: FormBuilder, private toastr: ToastrService, private service: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }
  ngOnInit(): void {
    this.form.reset();

    const token = localStorage.getItem("NHC_PL_Token")
    if (token) {
      this.toastr.info('أنت مسجل دخول بالفعل')
      this.router.navigate([''])
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.loader = true;
    if (this.form.invalid) {
      this.loader = false;
      this.toastr.error('تحقق من البيانات المدخلة', 'تسجيل الدخول');
      return;
    }

    this.service.Login(this.form.value).subscribe({
      next: (res: any) => {
        if (res.success == false) {
          this.toastr.error(res.message, 'تسجيل الدخول');
          this.loader = false;
          return;
        }
        this.toastr.success('تم تسجيل الدخول بنجاح! ✨');
        localStorage.setItem("NHC_PL_Token", res.token);
        localStorage.setItem("NHC_PL_RefreshToken", res.refreshToken); // ⬅️ أضف
        localStorage.setItem("NHC_PL_Role", res.role);
        this.router.navigate([""]);
      },
      error: (err) => {
        this.loader = false;
        this.toastr.error('تحقق من البيانات المدخلة', 'تسجيل الدخول');
      }
    });
  }

  // refreshToken() {
  //   return this.service.refreshToken('https://your-api.com/refresh')
  //     .subscribe((res: any) => {

  //       // خزّن التوكينات الجديدة
  //       localStorage.setItem('NHC_PL_Token', res);

  //       const newExpiresAt = Date.now() + 60 * 1000; // دقيقة واحدة

  //       localStorage.setItem('expiresAt', newExpiresAt.toString());

  //       // شغل التايمر من الأول
  //       this.startTokenTimer();
  //     });
  // }

  // startTokenTimer() {

  //   // لو فيه تايمر شغّال نلغيه
  //   if (this.refreshTimer) {
  //     clearTimeout(this.refreshTimer);
  //   }

  //   // هنخلي التايمر ثابت دقيقة واحدة فقط
  //   const oneMinute = 60 * 1000;

  //   this.refreshTimer = setTimeout(() => {
  //     this.refreshToken();
  //   }, oneMinute);
  // }

  // startTokenTimerOnAppLoad() {
  //   const accessToken = localStorage.getItem('NHC_PL_Token');
  //   const expiresAt = localStorage.getItem('expiresAt');

  //   // لو فيه توكن نخليه يكمل
  //   if (accessToken && expiresAt) {
  //     this.startTokenTimer();
  //   }
  // }
}
