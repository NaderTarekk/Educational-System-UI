// models/payment.model.ts

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  groupId: string;
  groupName?: string;
  amount: number;
  currency: string;
  method: number;
  reference: string;
  receivedBy: string;
  receivedByName?: string;
  createdAt: Date | string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
  group?: {
    id: string;
    name: string;
  };
  receivedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreatePaymentDto {
  id?: string;
  studentId: string;
  groupId: string;
  amount: number;
  currency?: string;
  method: number;
  reference?: string;
  receivedBy: string;
}

export interface PaymentStats {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

export enum PaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank',
  EWallet = 'wallet'
}

export const PaymentMethodLabels: { [key: string]: string } = {
  'cash': 'نقدي',
  'bank': 'تحويل بنكي',
  'wallet': 'محفظة إلكترونية'
};