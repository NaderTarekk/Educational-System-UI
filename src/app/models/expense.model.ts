export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
  reference?: string;
  createdAt?: string;
}

export interface CreateExpenseDto {
  id?: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string; 
  reference?: string;
}

export interface ExpenseResponse {
  success: boolean;
  message: string;
  data?: Expense | Expense[];
}