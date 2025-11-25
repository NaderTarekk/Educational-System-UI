import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { Observable } from 'rxjs';
import { ApiResponse, CreateExamDto, Exam, StudentExam, SubmitAnswerDto, UpdateExamDto } from '../../models/Exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamsService {

  private apiUrl = `${environment.examUrl}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ===== READ OPERATIONS =====

  getExamById(id: string): Observable<ApiResponse<Exam>> {
    return this.http.get<ApiResponse<Exam>>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  getExamByIdWithQuestions(id: string): Observable<ApiResponse<Exam>> {
    return this.http.get<ApiResponse<Exam>>(`${this.apiUrl}/${id}/with-questions`, {
      headers: this.getHeaders()
    });
  }

  getExamByIdWithQuestionsAndOptions(id: string): Observable<ApiResponse<Exam>> {
    return this.http.get<ApiResponse<Exam>>(`${this.apiUrl}/${id}/with-questions-and-options`, {
      headers: this.getHeaders()
    });
  }

  getAllExams(): Observable<ApiResponse<Exam[]>> {
    return this.http.get<ApiResponse<Exam[]>>(this.apiUrl + "/GetAllExams", {
      headers: this.getHeaders()
    });
  }

  getExamsByGroupId(groupId: string): Observable<ApiResponse<Exam[]>> {
    return this.http.get<ApiResponse<Exam[]>>(`${this.apiUrl}/group/${groupId}`, {
      headers: this.getHeaders()
    });
  }

  getActiveExams(): Observable<ApiResponse<Exam[]>> {
    return this.http.get<ApiResponse<Exam[]>>(`${this.apiUrl}/active`, {
      headers: this.getHeaders()
    });
  }

  getExamsByDateRange(startDate: Date, endDate: Date): Observable<ApiResponse<Exam[]>> {
    return this.http.get<ApiResponse<Exam[]>>(`${this.apiUrl}/date-range`, {
      headers: this.getHeaders(),
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  }

  examExists(id: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/${id}/exists`, {
      headers: this.getHeaders()
    });
  }

  getQuestionsCount(examId: string): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/${examId}/questions-count`, {
      headers: this.getHeaders()
    });
  }

  isExamAvailableForStudent(examId: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/${examId}/available-for-student`, {
      headers: this.getHeaders()
    });
  }

  hasStudentStartedExam(examId: string, studentId: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/${examId}/student/${studentId}/started`, {
      headers: this.getHeaders()
    });
  }

  // ===== WRITE OPERATIONS =====

  createExam(exam: CreateExamDto): Observable<any> {
    return this.http.post(this.apiUrl, exam, {
      headers: this.getHeaders()
    });
  }

  updateExam(id: string, exam: UpdateExamDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, exam, {
      headers: this.getHeaders()
    });
  }

  deleteExam(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ===== STUDENT EXAM OPERATIONS =====

  startExam(examId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${examId}/start`, {}, {
      headers: this.getHeaders()
    });
  }

  getStudentExam(examId: string): Observable<ApiResponse<StudentExam>> {
    return this.http.get<ApiResponse<StudentExam>>(`${this.apiUrl}/${examId}/student-exam`, {
      headers: this.getHeaders()
    });
  }

  submitAnswer(answer: SubmitAnswerDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-answer`, answer, {
      headers: this.getHeaders()
    });
  }

  submitExam(studentExamId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit/${studentExamId}`, {}, {
      headers: this.getHeaders()
    });
  }

  getStudentExamResult(studentExamId: string): Observable<ApiResponse<StudentExam>> {
    return this.http.get<ApiResponse<StudentExam>>(`${this.apiUrl}/result/${studentExamId}`, {
      headers: this.getHeaders()
    });
  }
}
