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

// ✅ NEW
export interface SendToAdminDto {
  subject: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  specificAdminId?: string;
  attachments?: any[];
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = `${environment.messageUrl}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ... existing methods

  // ✅ إرسال رسالة من طالب للأدمن
  sendToAdmin(formData: FormData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/send-to-admin`,
      formData,
      { headers: this.getHeadersForFile() } // ⬅️ بدون Content-Type
    );
  }

  // ✅ جلب قائمة الأدمن والمساعدين
  getAdminsList(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(
      `${this.apiUrl}/admins-list`,
      { headers: this.getHeaders() }
    );
  }

  // باقي الـ methods...
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

  private getHeadersForFile(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      // ❌ لا تضيف Content-Type عند إرسال FormData
      'Authorization': `Bearer ${token}`
    });
  }

  getMessageById(id: string): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  sendMessage(formData: FormData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      this.apiUrl,
      formData,
      { headers: this.getHeadersForFile() }
    );
  }

  sendToAll(formData: FormData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/send-to-all`,
      formData,
      { headers: this.getHeadersForFile() }
    );
  }

  sendToStudents(formData: FormData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/send-to-students`,
      formData,
      { headers: this.getHeadersForFile() }
    );
  }

  updateMessageStatus(messageId: string, isRead?: boolean, isStarred?: boolean): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/status`, {
      messageId,
      isRead,
      isStarred
    }, { headers: this.getHeaders() });
  }

  deleteMessage(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getStats(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`, { headers: this.getHeaders() });
  }
}