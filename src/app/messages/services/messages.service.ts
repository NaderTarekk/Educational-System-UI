// src/app/services/messages.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: any;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface CreateMessageDto {
  subject: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  recipientIds: string[];
  attachments?: any[];
}

export interface SendToAllDto {
  subject: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  attachments?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = `${environment.messageUrl}`; // تأكد من الـ URL

  constructor(private http: HttpClient) { }

  // ✅ دالة مساعدة للـ Headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // جلب جميع الرسائل
  getMyMessages(params: any = {}): Observable<MessageResponse> {
    let queryParams = new URLSearchParams();
    
    if (params.isRead !== undefined) queryParams.set('isRead', params.isRead.toString());
    if (params.isStarred !== undefined) queryParams.set('isStarred', params.isStarred.toString());
    if (params.priority) queryParams.set('priority', params.priority);
    if (params.searchTerm) queryParams.set('searchTerm', params.searchTerm);
    if (params.pageNumber) queryParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());

    const url = `${this.apiUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return this.http.get<MessageResponse>(url, { headers: this.getHeaders() });
  }

  // جلب رسالة واحدة
  getMessageById(id: string): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // إرسال رسالة لمستخدمين محددين
  sendMessage(dto: CreateMessageDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.apiUrl, dto, { headers: this.getHeaders() });
  }

  // إرسال للجميع
  sendToAll(dto: SendToAllDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/send-to-all`, dto, { headers: this.getHeaders() });
  }

  // إرسال لجميع الطلاب
  sendToStudents(dto: SendToAllDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/send-to-students`, dto, { headers: this.getHeaders() });
  }

  // تحديث حالة الرسالة
  updateMessageStatus(messageId: string, isRead?: boolean, isStarred?: boolean): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/status`, {
      messageId,
      isRead,
      isStarred
    }, { headers: this.getHeaders() });
  }

  // حذف رسالة
  deleteMessage(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // جلب الإحصائيات
  getStats(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }
}