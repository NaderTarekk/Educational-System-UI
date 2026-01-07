// payments.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CreatePaymentDto, Payment } from '../../../models/payments.model';
import { PaymentsService } from '../../services/payments.service';
import { UsersService } from '../../../user/services/users.service';
import { GroupsService } from '../../../groups/services/groups.service';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  // Data
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  students: any[] = [];
  groups: any[] = [];

  // Stats
  stats = {
    total: 0,
    cash: 0,
    bank: 0,
    wallet: 0,
    count: 0
  };

  // Filters
  searchTerm: string = '';
  selectedMethod: string = 'all';
  fromDate: string = '';
  toDate: string = '';

  // Loading states
  loading: boolean = false;
  saving: boolean = false;
  deleting: boolean = false;

  // Modals
  showModal: boolean = false;
  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  editMode: boolean = false;

  // Selected items
  selectedPayment: Payment | null = null;
  paymentToDelete: Payment | null = null;

  studentGroups: any[] = [];
  // Form
  paymentForm: FormGroup;

  // Current user ID (for delete operations)
  currentUserId: string = '';

  constructor(
    private paymentsService: PaymentsService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private usersService: UsersService,      // ✅ inject
    private groupsService: GroupsService,
  ) {
    this.paymentForm = this.fb.group({
      id: [''],
      studentId: ['', Validators.required],
      groupId: ['', Validators.required],
      amount: [0, Validators.required],
      method: [0, Validators.required],
      reference: [''],
      currency: ['ج.م']
    });
  }

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('NHC_PL_Token') || '';
    this.loadPayments();
    this.loadStudents();
    this.loadGroups();
  }

  // ==================== Data Loading ====================

  loadPayments(): void {
    this.loading = true;
    this.paymentsService.getAllPayments().subscribe({
      next: (payments) => {
        console.log(payments);

        this.payments = payments;
        this.filterPayments();
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.toastr.error('حدث خطأ أثناء تحميل المدفوعات', 'خطأ');
        this.loading = false;
      }
    });
  }

  loadStudents(): void {
    this.usersService.getAllUsers(1, 1000).subscribe({
      next: (response) => {
        // Filter only students (role === 'Student')
        this.students = response.data?.filter((user: any) =>
          user.role === 'Student' || user.roles?.includes('Student')
        ) || [];
      },
      error: (err) => {
        console.error('Error loading students:', err);
      }
    });
  }

  // ✅ Load groups from GroupsService
  loadGroups(): void {
    this.groupsService.getAllGroups().subscribe({
      next: (response) => {
        if (response.success) {
          this.groups = response.data || [];
        }
      },
      error: (err) => {
        console.error('Error loading groups:', err);
      }
    });
  }

  // في filterPayments()
  filterPayments(): void {
    let result = [...this.payments];

    // ✅ Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.student?.firstName?.toLowerCase().includes(search) ||
        p.student?.lastName?.toLowerCase().includes(search) ||
        p.studentId?.toLowerCase().includes(search) ||
        p.reference?.toLowerCase().includes(search) ||
        p.group?.name?.toLowerCase().includes(search)
      );
    }

    // ✅ Method filter
    if (this.selectedMethod !== 'all') {
      result = result.filter(p => {
        const methodClass = this.getMethodClass(p.method);
        return methodClass === this.selectedMethod;
      });
    }

    // ✅ Date filter
    if (this.fromDate) {
      const from = new Date(this.fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter(p => new Date(p.createdAt) >= from);
    }

    if (this.toDate) {
      const to = new Date(this.toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt) <= to);
    }

    this.filteredPayments = result;
  }
  onSearch(): void {
    this.filterPayments();
  }
  onStudentChange(): void {
    const studentId = this.paymentForm.get('studentId')?.value;

    if (!studentId) {
      this.studentGroups = [];
      this.paymentForm.patchValue({ groupId: '' });
      return;
    }

    this.usersService.getUserById(studentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const user = response.data;

          console.log('👤 User Data:', user);
          console.log('📦 UserGroups:', user.userGroups);

          // ✅ Get groups from userGroups
          if (user.userGroups && user.userGroups.length > 0) {
            // Extract group object from each userGroup
            this.studentGroups = user.userGroups
              .map((ug: any) => ug.group)
              .filter((g: any) => g != null); // Remove nulls
          } else {
            this.studentGroups = [];
          }

          console.log('✅ Student Groups:', this.studentGroups);

          // Auto-select if only one group
          if (this.studentGroups.length === 1) {
            this.paymentForm.patchValue({ groupId: this.studentGroups[0].id });
          } else {
            this.paymentForm.patchValue({ groupId: '' });
          }
        }
      },
      error: (err) => {
        console.error('❌ Error loading student:', err);
        this.studentGroups = [];
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterPayments();
  }

  filterByMethod(method: string): void {
    this.selectedMethod = method;
    this.filterPayments();
  }

  onDateFilter(): void {
    this.filterPayments();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedMethod = 'all';
    this.fromDate = '';
    this.toDate = '';
    this.filterPayments();
  }

  // ==================== Statistics ====================

 calculateStats(): void {
  this.stats = this.paymentsService.calculateStats(this.payments);
}

  getPercentage(value: number): number {
    if (this.stats.total === 0) return 0;
    return (value / this.stats.total) * 100;
  }

  // ==================== CRUD Operations ====================

  openAddModal(): void {
    this.editMode = false;
    this.paymentForm.reset({
      method: 0,
      currency: 'ج.م'
    });
    this.showModal = true;
  }

  editPayment(payment: Payment): void {
    this.editMode = true;
    this.paymentForm.patchValue({
      id: payment.id,
      studentId: payment.studentId,
      groupId: payment.groupId,
      amount: payment.amount,
      method: this.getMethodValue(payment.method),
      reference: payment.reference,
      currency: payment.currency
    });
    this.showModal = true;
  }

  savePayment(): void {
    if (this.paymentForm.invalid) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.saving = true;

    const formValue = this.paymentForm.value;

    // ✅ Build clean payload - NO null values
    const formData: any = {
      studentId: formValue.studentId,
      groupId: formValue.groupId,
      amount: Number(formValue.amount),
      currency: formValue.currency || 'ج.م',
      method: Number(formValue.method),
      receivedBy: this.currentUserId  // ✅ Must be GUID
    };

    // ✅ Only add ID for update
    if (this.editMode && formValue.id) {
      formData.id = formValue.id;
    }

    console.log('📤 Clean Payload:', formData);
    if (this.editMode) {

      this.paymentsService.updatePayment(formData).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('تم تحديث الدفعة بنجاح', 'نجاح');
            this.loadPayments();
            this.closeModal();
          } else {
            this.toastr.error(res.message, 'خطأ');
          }
          this.saving = false;
        },
        error: (err) => {
          console.error('Error updating payment:', err);
          this.toastr.error('حدث خطأ أثناء تحديث الدفعة', 'خطأ');
          this.saving = false;
        }
      });
    } else {
      console.log("log");

      this.paymentsService.createPayment(formData).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('تم إضافة الدفعة بنجاح', 'نجاح');
            this.loadPayments();
            this.closeModal();
          } else {
            this.toastr.error(res.message, 'خطأ');
          }
          this.saving = false;
        },
        error: (err) => {
          console.error('Error creating payment:', err);
          this.toastr.error('حدث خطأ أثناء إضافة الدفعة', 'خطأ');
          this.saving = false;
        }
      });
    }
  }

  confirmDelete(payment: Payment): void {
    this.paymentToDelete = payment;
    this.showDeleteModal = true;
  }

  deletePayment(): void {
    if (!this.paymentToDelete) return;

    this.deleting = true;
    console.log(this.currentUserId);

    this.paymentsService.deletePayment(this.paymentToDelete.id, this.currentUserId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('تم حذف الدفعة بنجاح', 'نجاح');
          this.loadPayments();
          this.closeDeleteModal();
        } else {
          this.toastr.error(res.message, 'خطأ');
        }
        this.deleting = false;
      },
      error: (err) => {
        console.error('Error deleting payment:', err);
        this.toastr.error('حدث خطأ أثناء حذف الدفعة', 'خطأ');
        this.deleting = false;
      }
    });
  }

  viewPayment(payment: Payment): void {
    this.selectedPayment = payment;
    this.showViewModal = true;
  }

  // ==================== Modal Controls ====================

  closeModal(): void {
    this.showModal = false;
    this.paymentForm.reset();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.paymentToDelete = null;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedPayment = null;
  }

  // ==================== Helper Methods ====================

  getMethodValue(method: any): number {
    // If already a number, return it
    if (typeof method === 'number') return method;

    const m = String(method).toLowerCase();

    // ✅ Handle string values from backend
    if (m === 'cash' || m === 'نقدي' || m === '0') return 0;
    if (m === 'transfer' || m === 'bank' || m === 'banktransfer' || m === 'بنكي' || m === '1') return 1;
    if (m === 'card' || m === 'wallet' || m === 'ewallet' || m === 'محفظة' || m === '2') return 2;

    return 0;
  }

  // ✅ Get method class for styling
  getMethodClass(method: any): string {
    const value = this.getMethodValue(method);
    const classes: { [key: number]: string } = {
      0: 'cash',
      1: 'bank',
      2: 'wallet'
    };
    return classes[value] || 'cash';
  }

  // ✅ Get method label for display
  getMethodLabel(method: any): string {
    const value = this.getMethodValue(method);
    const labels: { [key: number]: string } = {
      0: 'نقدي',
      1: 'تحويل بنكي',
      2: 'محفظة إلكترونية'
    };
    return labels[value] || 'نقدي';
  }

  getInitials(firstName?: string, lastName?: string): string {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || '??';
  }

  getAvatarColor(id: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
    ];

    // Generate consistent color based on ID
    let hash = 0;
    for (let i = 0; i < (id?.length || 0); i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}