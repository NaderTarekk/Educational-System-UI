import { Component, OnInit } from '@angular/core';
import { Payment, PaymentMethod, PaymentStats } from '../../../models/payment.model';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  searchTerm: string = '';
  selectedMethod: string = 'all';

  stats: PaymentStats[] = [
    { icon: 'dollar-sign', label: 'إجمالي المدفوعات', value: '45,750', color: 'bg-blue-100 text-blue-600' },
    { icon: 'credit-card', label: 'نقدي', value: '25,500', color: 'bg-green-100 text-green-600' },
    { icon: 'banknote', label: 'تحويل بنكي', value: '15,250', color: 'bg-orange-100 text-orange-600' },
    { icon: 'wallet', label: 'محفظة إلكترونية', value: '5,000', color: 'bg-purple-100 text-purple-600' }
  ];

  payments: Payment[] = [
    {
      id: '1',
      studentId: 'STD001',
      studentName: 'علي حسن',
      groupId: 'GRP-A1',
      amount: 500,
      currency: 'ج.م',
      method: PaymentMethod.Cash,
      methodBadge: 'cash',
      reference: 'REF-2024-001',
      receivedBy: 'أحمد محمد',
      date: '2024-11-10',
      avatar: 'AH'
    },
    {
      id: '2',
      studentId: 'STD002',
      studentName: 'سارة محمد',
      groupId: 'GRP-B2',
      amount: 750,
      currency: 'ج.م',
      method: PaymentMethod.BankTransfer,
      methodBadge: 'bank',
      reference: 'TRX-98765',
      receivedBy: 'فاطمة أحمد',
      date: '2024-11-09',
      avatar: 'SM'
    },
    {
      id: '3',
      studentId: 'STD003',
      studentName: 'محمد عبدالله',
      groupId: 'GRP-C3',
      amount: 600,
      currency: 'ج.م',
      method: PaymentMethod.EWallet,
      methodBadge: 'wallet',
      reference: 'WALLET-456',
      receivedBy: 'خالد إبراهيم',
      date: '2024-11-08',
      avatar: 'MA'
    },
    {
      id: '4',
      studentId: 'STD004',
      studentName: 'نور الدين',
      groupId: 'GRP-A1',
      amount: 500,
      currency: 'ج.م',
      method: PaymentMethod.Cash,
      methodBadge: 'cash',
      reference: 'REF-2024-002',
      receivedBy: 'أحمد محمد',
      date: '2024-11-07',
      avatar: 'ND'
    }
  ];

  filteredPayments: Payment[] = [];

  ngOnInit(): void {
    this.filterPayments();
  }

  filterPayments(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesSearch = payment.studentName.includes(this.searchTerm) ||
        payment.studentId.includes(this.searchTerm) ||
        payment.reference?.includes(this.searchTerm);
      const matchesMethod = this.selectedMethod === 'all' || payment.methodBadge === this.selectedMethod;
      return matchesSearch && matchesMethod;
    });
  }

  onSearchChange(): void {
    this.filterPayments();
  }

  selectMethod(method: string): void {
    this.selectedMethod = method;
    this.filterPayments();
  }

  getMethodBadgeColor(method: string): string {
    const colors: { [key: string]: string } = {
      cash: 'bg-green-100 text-green-700',
      bank: 'bg-orange-100 text-orange-700',
      wallet: 'bg-purple-100 text-purple-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  }

  viewPayment(payment: Payment): void {
    console.log('View payment:', payment);
    // Implement view logic
  }

  editPayment(payment: Payment): void {
    console.log('Edit payment:', payment);
    // Implement edit logic
  }

  deletePayment(payment: Payment): void {
    console.log('Delete payment:', payment);
    // Implement delete logic
  }

  addNewPayment(): void {
    console.log('Add new payment');
    // Implement add logic
  }

}
