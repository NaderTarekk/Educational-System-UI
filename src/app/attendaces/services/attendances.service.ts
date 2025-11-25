import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Attendance, AttendanceStats, BulkAttendance } from '../../models/attendance.model';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/group.model';

@Injectable({
  providedIn: 'root'
})
export class AttendancesService {

  private apiUrl = `${environment.attendanceUrl}`;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  constructor(private http: HttpClient) { }

  // Create bulk attendance
  createBulkAttendance(data: BulkAttendance): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk`, data,
      { headers: this.getHeaders() });
  }

  // Update single attendance
  updateAttendance(data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}`, data,
      { headers: this.getHeaders() });
  }

  // Get attendance by group and date
  getByGroupAndDate(groupId: string, date: string): Observable<ApiResponse<Attendance[]>> {
    return this.http.get<ApiResponse<Attendance[]>>(`${this.apiUrl}/group/${groupId}/date/${date}`,
      { headers: this.getHeaders() });
  }

  // Get attendance by student
  // attendances.service.ts
  // attendances.service.ts
  getByStudent(
    studentId: string,
    groupId?: string,
    startDate?: string,
    endDate?: string
  ): Observable<ApiResponse<Attendance[]>> {
    let params = new HttpParams();
    if (groupId) params = params.set('groupId', groupId);

    if (startDate) {
      // ✅ أرسل التاريخ بصيغة YYYY-MM-DD فقط
      console.log('📤 Sending startDate:', startDate);
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      console.log('📤 Sending endDate:', endDate);
      params = params.set('endDate', endDate);
    }

    console.log('📤 Final params:', params.toString());

    return this.http.get<ApiResponse<Attendance[]>>(`${this.apiUrl}/student/${studentId}`, {
      params,
      headers: this.getHeaders()
    });
  }

  getStats(
    groupId?: string,
    studentId?: string,
    startDate?: string,
    endDate?: string
  ): Observable<ApiResponse<AttendanceStats>> {
    let params = new HttpParams();
    if (groupId) params = params.set('groupId', groupId);
    if (studentId) params = params.set('studentId', studentId);

    // ✅ أضف الوقت للتواريخ
    if (startDate) {
      const fixedStartDate = startDate + 'T00:00:00';
      params = params.set('startDate', fixedStartDate);
    }

    if (endDate) {
      const fixedEndDate = endDate + 'T23:59:59';
      params = params.set('endDate', fixedEndDate);
    }

    return this.http.get<ApiResponse<AttendanceStats>>(`${this.apiUrl}/stats`, {
      params,
      headers: this.getHeaders()
    });
  }
}
