// src/app/services/subjects.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateSubjectDto,
  AssignUsersDto,
  SubjectResponse
} from '../../models/subject.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectsService {
  private apiUrl = `${environment.subjectUrl}`; // مثال: https://localhost:7273/api/subjects

  constructor(private http: HttpClient) { }

  // Helper method للـ Headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========== CRUD Operations ==========

  // Get all subjects
  getAllSubjects(): Observable<SubjectResponse> {
    return this.http.get<SubjectResponse>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  // Get subject by ID
  getSubjectById(id: string): Observable<SubjectResponse> {
    return this.http.get<SubjectResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Get statistics
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders()
    });
  }

  // Create subject
  createSubject(dto: CreateSubjectDto): Observable<any> {
    return this.http.post(this.apiUrl, dto, {
      headers: this.getHeaders()
    });
  }

  // Update subject
  updateSubject(dto: CreateSubjectDto): Observable<any> {
    return this.http.put(this.apiUrl, dto, {
      headers: this.getHeaders()
    });
  }

  // Delete subject
  deleteSubject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== User Management ==========

  // Get users by subject ID
  getSubjectUsers(subjectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${subjectId}/users`, {
      headers: this.getHeaders()
    });
  }

  // Get subjects by user ID
  getUserSubjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-subjects`, {
      headers: this.getHeaders()
    });
  }

  // Assign users to subject
  assignUsers(dto: AssignUsersDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-users`, dto, {
      headers: this.getHeaders()
    });
  }

  // Remove user from subject
  removeUser(subjectId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${subjectId}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }
}