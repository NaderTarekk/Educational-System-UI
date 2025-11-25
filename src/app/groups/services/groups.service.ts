import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse, Group, Student } from '../../models/group.model';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllGroups(): Observable<ApiResponse<Group[]>> {
    return this.http.get<ApiResponse<Group[]>>(
      `${environment.groupUrl}/GetAllGroups`,
      { headers: this.getHeaders() }
    );
  }

  getGroupById(id: string): Observable<ApiResponse<Group>> {
    return this.http.get<ApiResponse<Group>>(
      `${environment.groupUrl}/GetGroupById/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createNewGroup(group: Group): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.groupUrl}/CreateNewGroup`,
      { group: group },
      { headers: this.getHeaders() }
    );
  }

  updateGroup(group: Group): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${environment.groupUrl}/UpdateGroup`,
      group,
      { headers: this.getHeaders() }
    );
  }

  deleteGroup(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${environment.groupUrl}/DeleteGroup/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getStudentsByGroupId(groupId: string): Observable<ApiResponse<Student[]>> {
    return this.http.get<ApiResponse<Student[]>>(
      `${environment.groupUrl}/GetStudentsByGroupId/${groupId}`,
      { headers: this.getHeaders() }
    );
  }

  addStudentsToGroup(groupId: string, studentIds: string[]): Observable<ApiResponse<Student[]>> {
    return this.http.post<ApiResponse<Student[]>>(
      `${environment.groupUrl}/AddStudentsToGroup/${groupId}`,
      studentIds,
      { headers: this.getHeaders() }
    );
  }

  removeStudentFromGroup(groupId: string, studentId: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${environment.groupUrl}/DeleteStudentFromGroup/${groupId}/${studentId}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
