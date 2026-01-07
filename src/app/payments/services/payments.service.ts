// services/payments.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environment';
import { CreatePaymentDto, Payment } from '../../models/payments.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private apiUrl = `${environment.paymentUrl}`;

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Get all payments
  getAllPayments(): Observable<Payment[]> {
    this.loadingSubject.next(true);
    return this.http.get<ApiResponse<Payment[]>>(this.apiUrl).pipe(
      map(response => response.data || []),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Get payment by ID
  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<ApiResponse<Payment>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Get payments by student ID
  getPaymentsByStudentId(studentId: string): Observable<Payment[]> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/student/${studentId}`).pipe(
      map(response => response.data || [])
    );
  }

  // Get payments by date range
  getPaymentsByDateRange(fromDate: Date, toDate: Date): Observable<Payment[]> {
    const params = new HttpParams()
      .set('fromDate', fromDate.toISOString())
      .set('toDate', toDate.toISOString());

    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/range`, { params }).pipe(
      map(response => response.data || [])
    );
  }

  // Create new payment
  // payments.service.ts

  createPayment(payment: CreatePaymentDto): Observable<ApiResponse<any>> {
    console.log('🚀 Creating payment...');
    console.log('📍 URL:', this.apiUrl);
    console.log('📦 Payload:', JSON.stringify(payment, null, 2));

    this.loadingSubject.next(true);
    return this.http.post<ApiResponse<any>>(this.apiUrl, payment).pipe(
      tap({
        next: (res) => console.log('✅ Response:', res),
        error: (err) => console.error('❌ Error:', err)
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Update payment
  updatePayment(payment: CreatePaymentDto): Observable<ApiResponse<any>> {
    this.loadingSubject.next(true);
    return this.http.put<ApiResponse<any>>(this.apiUrl, payment).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Delete payment
  deletePayment(id: string, deletedBy: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('deletedBy', deletedBy);
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, { params });
  }

  calculateStats(payments: Payment[]): {
    total: number;
    cash: number;
    bank: number;
    wallet: number;
    count: number;
  } {
    return payments.reduce((acc, payment) => {
      acc.total += payment.amount;
      acc.count++;

      const method = String(payment.method).toLowerCase();

      if (method === 'cash' || method === '0') {
        acc.cash += payment.amount;
      } else if (method === 'transfer' || method === 'bank' || method === 'banktransfer' || method === '1') {
        acc.bank += payment.amount;
      } else if (method === 'card' || method === 'wallet' || method === 'ewallet' || method === '2') {
        acc.wallet += payment.amount;
      }

      return acc;
    }, { total: 0, cash: 0, bank: 0, wallet: 0, count: 0 });
  }
  // ✅ Helper method (add it if not exists)
  private getMethodValue(method: any): number {
    if (typeof method === 'number') return method;

    const m = String(method).toLowerCase();
    if (m.includes('cash') || m === 'نقدي' || m === '0') return 0;
    if (m.includes('bank') || m === 'بنكي' || m === '1') return 1;
    if (m.includes('wallet') || m === 'محفظة' || m === '2') return 2;
    return 0;
  }
}