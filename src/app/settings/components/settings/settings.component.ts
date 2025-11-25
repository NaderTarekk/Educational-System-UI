import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  activeTab = 'general';
  generalForm: FormGroup;
  appearanceForm: FormGroup;
  notificationsForm: FormGroup;
  securityForm: FormGroup;
  emailForm: FormGroup;
  isLoading = false;
  isSaving = false;

  tabs = [
    { id: 'general', name: 'عام', icon: 'fa-cog' },
    { id: 'appearance', name: 'المظهر', icon: 'fa-palette' },
    { id: 'notifications', name: 'الإشعارات', icon: 'fa-bell' },
    { id: 'security', name: 'الأمان', icon: 'fa-shield-alt' },
    { id: 'email', name: 'البريد الإلكتروني', icon: 'fa-envelope' }
  ];

  timezones = [
    { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)' },
    { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)' },
    { value: 'Asia/Dubai', label: 'دبي (GMT+4)' },
    { value: 'Europe/London', label: 'لندن (GMT+0)' }
  ];

  languages = [
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'English' }
  ];

  colors = [
    { name: 'أزرق', value: '#3B82F6' },
    { name: 'أخضر', value: '#10B981' },
    { name: 'أرجواني', value: '#8B5CF6' },
    { name: 'وردي', value: '#EC4899' },
    { name: 'برتقالي', value: '#F59E0B' },
    { name: 'أحمر', value: '#EF4444' }
  ];

  constructor(private fb: FormBuilder) {
    this.generalForm = this.fb.group({
      siteName: ['منصة التعليم', [Validators.required]],
      siteDescription: ['منصة تعليمية شاملة لإدارة الطلاب والمدرسين', [Validators.required]],
      contactEmail: ['info@platform.com', [Validators.required, Validators.email]],
      phoneNumber: ['01234567890'],
      address: ['القاهرة، مصر'],
      timezone: ['Africa/Cairo'],
      language: ['ar']
    });

    this.appearanceForm = this.fb.group({
      primaryColor: ['#3B82F6'],
      secondaryColor: ['#8B5CF6'],
      darkMode: [false],
      sidebarPosition: ['right'],
      fontSize: ['medium']
    });

    this.notificationsForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
      pushNotifications: [true],
      notifyOnNewUser: [true],
      notifyOnNewMessage: [true],
      notifyOnPayment: [true]
    });

    this.securityForm = this.fb.group({
      twoFactorAuth: [false],
      sessionTimeout: [30, [Validators.required, Validators.min(5)]],
      passwordExpiry: [90, [Validators.required, Validators.min(30)]],
      loginAttempts: [5, [Validators.required, Validators.min(3)]],
      maintenanceMode: [false]
    });

    this.emailForm = this.fb.group({
      smtpHost: ['smtp.gmail.com', [Validators.required]],
      smtpPort: [587, [Validators.required]],
      smtpUsername: ['', [Validators.required]],
      smtpPassword: [''],
      smtpEncryption: ['tls'],
      fromEmail: ['noreply@platform.com', [Validators.required, Validators.email]],
      fromName: ['منصة التعليم', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  saveSettings(): void {
    let currentForm: FormGroup;

    switch (this.activeTab) {
      case 'general':
        currentForm = this.generalForm;
        break;
      case 'appearance':
        currentForm = this.appearanceForm;
        break;
      case 'notifications':
        currentForm = this.notificationsForm;
        break;
      case 'security':
        currentForm = this.securityForm;
        break;
      case 'email':
        currentForm = this.emailForm;
        break;
      default:
        return;
    }

    if (currentForm.invalid) {
      currentForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    // Simulate API call
    setTimeout(() => {
      this.isSaving = false;
      alert('تم حفظ الإعدادات بنجاح! ✅');
    }, 1500);
  }

  resetSettings(): void {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      this.ngOnInit();
    }
  }

  testEmailConnection(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      alert('تم اختبار الاتصال بنجاح! ✅');
    }, 2000);
  }

}
