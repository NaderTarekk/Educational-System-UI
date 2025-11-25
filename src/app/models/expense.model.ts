export interface CreateExpenseDto {
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    date?: Date;
    reference?: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    paidByUser: {
        id: string;
        userName: string;
        fullName: string;
    };
    date: string;
    reference: string;
    createdAt: string;
}