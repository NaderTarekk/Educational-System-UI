export interface Payment {
    id: string;
    studentId: string;
    studentName: string;
    groupId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    methodBadge: string;
    reference?: string;
    receivedBy: string;
    date: string;
    avatar: string;
}

export enum PaymentMethod {
    Cash = 'نقدي',
    BankTransfer = 'تحويل بنكي',
    EWallet = 'محفظة إلكترونية'
}

export interface PaymentStats {
    icon: string;
    label: string;
    value: string;
    color: string;
}