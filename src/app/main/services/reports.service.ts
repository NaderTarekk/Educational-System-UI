import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface DashboardStatistics {
  // Users
  totalStudents: number;
  totalAdmins: number;
  totalAssistants: number;
  newStudentsThisMonth: number;
  studentGrowthPercentage: number;

  // Groups
  totalGroups: number;
  activeGroups: number;
  newGroupsThisMonth: number;

  // Subjects
  totalSubjects: number;

  // Financial
  totalRevenue: number;
  revenueThisMonth: number;
  revenueToday: number;
  pendingPayments: number;
  studentsWithPendingPayments: number;
  totalExpenses: number;
  expensesThisMonth: number;
  netProfit: number;
  revenueGrowthPercentage: number;

  // Attendance
  averageAttendanceRate: number;
  totalAttendanceRecords: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;

  // Exams
  totalExams: number;
  activeExams: number;
  completedExams: number;
  averageExamScore: number;
  examPassRate: number;

  // Messages
  totalMessages: number;
  unreadMessages: number;
  messagesToday: number;

  // Videos
  totalVideos: number;
  freeVideos: number;
}

export interface StudentDashboard {
  myGroupsCount: number;
  mySubjectsCount: number;
  totalMessages: number;
  unreadMessages: number;
  availableVideos: number;
  examsTaken: number;
  averageScore: number;
  attendanceDays: number;
  attendanceRate: number;
  myGroups: Array<{
    groupId: string;
    groupName: string;
  }>;
  mySubjects: Array<{
    subjectId: string;
    subjectName: string;
    description: string;
  }>;
  upcomingExams: Array<{
    examId: string;
    examTitle: string;
    groupName: string;
    startDate: Date;
    duration: number;
    totalMarks: number;
  }>;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  paymentsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.reportUrl}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Dashboard Statistics (Admin/Assistant)
  getDashboardStatistics(): Observable<DashboardStatistics> {
    return this.http.get<DashboardStatistics>(`${this.apiUrl}/dashboard-statistics`, {
      headers: this.getHeaders()
    });
  }

  // Student Dashboard
  getStudentDashboard(): Observable<StudentDashboard> {
    return this.http.get<StudentDashboard>(`${this.apiUrl}/student-dashboard`, {
      headers: this.getHeaders()
    });
  }

  exportRevenuePdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-pdf`, {
      headers: this.getHeaders(),
      responseType: 'blob' // ✅ Important!
    });
  }

  // Revenue Report (Admin)
  getRevenueReport(startDate?: Date, endDate?: Date, groupId?: string): Observable<any> {
    let params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (groupId) params.groupId = groupId;

    return this.http.get(`${this.apiUrl}/revenue`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Attendance Report (Admin/Assistant)
  getAttendanceReport(startDate?: Date, endDate?: Date, groupId?: string): Observable<any> {
    let params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (groupId) params.groupId = groupId;

    return this.http.get(`${this.apiUrl}/attendance`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Exams Report (Admin/Assistant)
  getExamsReport(startDate?: Date, endDate?: Date, groupId?: string, subjectId?: string): Observable<any> {
    let params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (groupId) params.groupId = groupId;
    if (subjectId) params.subjectId = subjectId;

    return this.http.get(`${this.apiUrl}/exams`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Expenses Report (Admin)
  getExpensesReport(startDate?: Date, endDate?: Date, category?: string): Observable<any> {
    let params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (category) params.category = category;

    return this.http.get(`${this.apiUrl}/expenses`, {
      headers: this.getHeaders(),
      params
    });
  }
}