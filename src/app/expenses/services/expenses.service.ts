import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateExpenseDto, ExpenseResponse } from '../../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private apiUrl = `${environment.expenseUrl}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all expenses
  getAllExpenses(): Observable<ExpenseResponse> {
    return this.http.get<ExpenseResponse>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Get expense by ID
  getExpenseById(id: string): Observable<ExpenseResponse> {
    return this.http.get<ExpenseResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Get expenses by date range
  getExpensesByDateRange(fromDate: string, toDate: string): Observable<ExpenseResponse> {
    return this.http.get<ExpenseResponse>(
      `${this.apiUrl}/range?fromDate=${fromDate}&toDate=${toDate}`,
      { headers: this.getHeaders() }
    );
  }

  // Create expense
  // src/app/services/expenses.service.ts

  // ✅ غير الـ createExpense method:
  createExpense(dto: CreateExpenseDto): Observable<any> {
    // ⬅️ لف الـ DTO في object اسمه "expense"
    const payload = {
      expense: dto
    };

    console.log('📤 Sending payload:', payload);

    return this.http.post(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  // ✅ نفس الشيء في updateExpense:
  updateExpense(dto: CreateExpenseDto): Observable<any> {
    const payload = {
      expense: dto
    };

    console.log('📤 Updating payload:', payload);

    return this.http.put(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  // Delete expense
  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
