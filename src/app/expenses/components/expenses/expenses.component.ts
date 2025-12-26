// src/app/pages/expenses/expenses.component.ts
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CreateExpenseDto, Expense } from '../../../models/expense.model';
import { ExpensesService } from '../../services/expenses.service';
import { AuthService } from '../../../auth/components/auth-service'; // ⬅️ أضف هذا

interface ExpenseStats {
  icon: string;
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-expenses',
  standalone: false,
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {
  searchTerm: string = '';
  selectedCategory: string = 'all';
  isLoading = false;

  stats: ExpenseStats[] = [
    { icon: 'dollar-sign', label: 'إجمالي النفقات', value: '0', color: 'bg-blue-100 text-blue-600' },
    { icon: 'credit-card', label: 'الرواتب', value: '0', color: 'bg-green-100 text-green-600' },
    { icon: 'banknote', label: 'المرافق', value: '0', color: 'bg-orange-100 text-orange-600' },
    { icon: 'wallet', label: 'أخرى', value: '0', color: 'bg-purple-100 text-purple-600' }
  ];

  expenses: Expense[] = [];
  filteredExpenses: any[] = [];

  // Dialog states
  isAddDialogOpen = false;
  isEditDialogOpen = false;
  isViewDialogOpen = false;
  isDeleteDialogOpen = false;

  selectedExpense: Expense | null = null;
  expenseToDelete: Expense | null = null;

  isSaving = false;
  isDeleting = false;

  // Form data
  formData: any = {};

  categories = [
    { value: 'Salaries', label: 'الرواتب' },
    { value: 'Utilities', label: 'المرافق' },
    { value: 'Supplies', label: 'اللوازم' },
    { value: 'Maintenance', label: 'الصيانة' },
    { value: 'Marketing', label: 'التسويق' },
    { value: 'Other', label: 'أخرى' }
  ];

  constructor(
    private expensesService: ExpensesService,
    private authService: AuthService, // ⬅️ أضف هذا
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.isLoading = true;

    this.expensesService.getAllExpenses().subscribe({
      next: (response: any) => {
        console.log(response.data);
        
        if (response.success && response.data) {
          this.expenses = Array.isArray(response.data) ? response.data : [response.data];
          this.filteredExpenses = this.expenses;
          this.calculateStats();
        } else {
          this.expenses = [];
          this.filteredExpenses = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading expenses:', error);
        this.toastr.error('فشل تحميل النفقات', 'خطأ');
        this.expenses = [];
        this.filteredExpenses = [];
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    const total = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const salaries = this.expenses.filter(e => e.category === 'Salaries').reduce((sum, exp) => sum + exp.amount, 0);
    const utilities = this.expenses.filter(e => e.category === 'Utilities').reduce((sum, exp) => sum + exp.amount, 0);
    const other = this.expenses.filter(e => e.category === 'Other').reduce((sum, exp) => sum + exp.amount, 0);

    this.stats[0].value = total.toLocaleString('ar-EG');
    this.stats[1].value = salaries.toLocaleString('ar-EG');
    this.stats[2].value = utilities.toLocaleString('ar-EG');
    this.stats[3].value = other.toLocaleString('ar-EG');
  }

  filterExpenses(): void {
    this.filteredExpenses = this.expenses.filter(expense => {
      const matchesSearch =
        expense.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        expense.paidBy.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        expense.reference?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'all' || expense.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange(): void {
    this.filterExpenses();
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filterExpenses();
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Salaries': 'bg-green-100 text-green-700',
      'Utilities': 'bg-orange-100 text-orange-700',
      'Supplies': 'bg-blue-100 text-blue-700',
      'Maintenance': 'bg-yellow-100 text-yellow-700',
      'Marketing': 'bg-pink-100 text-pink-700',
      'Other': 'bg-purple-100 text-purple-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  // Add Dialog
  openAddDialog(): void {
    this.formData = {
      description: '',
      amount: 0,
      category: 'Other',
      paidBy: '',
      date: new Date().toISOString().split('T')[0],
      reference: ''
    };
    this.isAddDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddDialog(): void {
    this.isAddDialogOpen = false;
    document.body.style.overflow = 'auto';
  }

  // Edit Dialog
  openEditDialog(expense: Expense): void {
    this.selectedExpense = expense;
    this.formData = {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      paidBy: expense.paidBy,
      date: expense.date.split('T')[0],
      reference: expense.reference || ''
    };
    this.isEditDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditDialog(): void {
    this.isEditDialogOpen = false;
    this.selectedExpense = null;
    document.body.style.overflow = 'auto';
  }

  // View Dialog
  viewExpense(expense: Expense): void {
    this.selectedExpense = expense;
    this.isViewDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeViewDialog(): void {
    this.isViewDialogOpen = false;
    this.selectedExpense = null;
    document.body.style.overflow = 'auto';
  }

  // Delete Dialog
  openDeleteDialog(expense: Expense): void {
    this.expenseToDelete = expense;
    this.isDeleteDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.expenseToDelete = null;
    document.body.style.overflow = 'auto';
  }

  // Form validation
  isFormValid(): boolean {
    return this.formData.description.trim().length >= 3 &&
      this.formData.amount > 0 &&
      this.formData.category.length > 0;
  }

  // ✅ Save (Add) - مُحدّث
  saveExpense(): void {
    if (!this.isFormValid() || this.isSaving) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.isSaving = true;

    // ✅ احصل على الـ userId من الـ Token
    const currentUserId = this.authService.getCurrentUserId();

    if (!currentUserId) {
      this.toastr.error('لم يتم العثور على معرف المستخدم', 'خطأ');
      this.isSaving = false;
      return;
    }

    const expenseData: CreateExpenseDto = {
      description: this.formData.description.trim(),
      amount: Number(this.formData.amount),
      category: this.formData.category,
      paidBy: currentUserId, // ⬅️ استخدم userId من الـ Token
      date: new Date(this.formData.date).toISOString(),
      reference: this.formData.reference?.trim() || undefined
    };

    console.log('📤 Sending expense:', expenseData);

    this.expensesService.createExpense(expenseData).subscribe({
      next: (response: any) => {
        console.log('✅ Response:', response);
        if (response.success) {
          this.toastr.success('تم إضافة النفقة بنجاح', 'نجاح');
          this.closeAddDialog();
          this.loadExpenses();
        } else {
          this.toastr.error(response.message || 'فشل إضافة النفقة', 'خطأ');
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('❌ Error creating expense:', error);
        console.error('   Error details:', error.error);
        console.error('   Validation errors:', error.error?.errors);

        if (error.error?.errors) {
          console.log('📋 Full errors:', JSON.stringify(error.error.errors, null, 2));
          const errorMessages = Object.entries(error.error.errors)
            .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          this.toastr.error(errorMessages, 'خطأ في البيانات');
        } else {
          this.toastr.error('حدث خطأ أثناء إضافة النفقة', 'خطأ');
        }

        this.isSaving = false;
      }
    });
  }

  // ✅ Update - مُحدّث
  updateExpense(): void {
    if (!this.isFormValid() || this.isSaving) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.isSaving = true;

    const expenseData: CreateExpenseDto = {
      id: this.formData.id,
      description: this.formData.description.trim(),
      amount: Number(this.formData.amount),
      category: this.formData.category,
      paidBy: this.formData.paidBy, // الـ paidBy موجود مسبقاً من الـ expense
      date: new Date(this.formData.date).toISOString(),
      reference: this.formData.reference?.trim() || undefined
    };

    console.log('📤 Updating expense:', expenseData);

    this.expensesService.updateExpense(expenseData).subscribe({
      next: (response: any) => {
        console.log('✅ Response:', response);
        if (response.success) {
          this.toastr.success('تم تحديث النفقة بنجاح', 'نجاح');
          this.closeEditDialog();
          this.loadExpenses();
        } else {
          this.toastr.error(response.message || 'فشل تحديث النفقة', 'خطأ');
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('❌ Error updating expense:', error);
        console.error('   Error details:', error.error);

        if (error.error?.errors) {
          const errorMessages = Object.entries(error.error.errors)
            .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          this.toastr.error(errorMessages, 'خطأ في البيانات');
        } else {
          this.toastr.error('حدث خطأ أثناء تحديث النفقة', 'خطأ');
        }

        this.isSaving = false;
      }
    });
  }

  // Delete
  confirmDelete(): void {
    if (!this.expenseToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.expensesService.deleteExpense(this.expenseToDelete.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم حذف النفقة بنجاح', 'نجاح');
          this.closeDeleteDialog();
          this.loadExpenses();
        } else {
          this.toastr.error(response.message || 'فشل حذف النفقة', 'خطأ');
        }
        this.isDeleting = false;
      },
      error: (error: any) => {
        console.error('Error deleting expense:', error);
        this.toastr.error('حدث خطأ أثناء حذف النفقة', 'خطأ');
        this.isDeleting = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(name: string): string {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  }
}