import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { GetByIdResponse, ResponseMessage, User } from '../../models/user.model';
import { environment } from '../../environment';
import { Group } from '../../models/group.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // users.service.ts
  getAllUsers(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(
      `${environment.userUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      { headers: this.getHeaders() }
    );
  }

  getAllGroups(): Observable<GetByIdResponse<Group[]>> {
    return this.http.get<GetByIdResponse<Group[]>>(`${environment.groupUrl}/GetAllGroups`, {
      headers: this.getHeaders()
    });
  }

  getUserById(id: string): Observable<GetByIdResponse<User>> {
    return this.http.get<GetByIdResponse<User>>(`${environment.userUrl}/profile/${id}`, {
      headers: this.getHeaders()
    });
  }

  addUser(user: User): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${environment.userUrl}`, user, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: string, user: User): Observable<ResponseMessage> {
    const updateData = { ...user, id };
    return this.http.put<ResponseMessage>(`${environment.userUrl}`, updateData, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): Observable<ResponseMessage> {
    return this.http.delete<ResponseMessage>(`${environment.userUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
