// src/auth/components/auth-service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // ⬅️ هنحتاج نثبت المكتبة دي

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  Login(form: any) {
    return this.http.post(environment.authUrl + "login", form)
  }

  getCurrentUserRole(): string {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      
      if (!token) {
        console.warn('No token found');
        return '';
      }

      // فك تشفير الـ JWT Token
      const decodedToken: any = jwtDecode(token);

      // الـ Role ممكن يكون موجود بأسماء مختلفة في الـ JWT
      // جرب الخيارات دي:
      const role = decodedToken.role || 
                   decodedToken.Role || 
                   decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                   decodedToken['role'];

      return role || '';
      
    } catch (error) {
      console.error('Error decoding token:', error);
      return '';
    }
  }

  refreshToken(id: string) {
    return this.http.get<any>(`${environment.authUrl}RefreshToken?id=${id}`, { headers: this.getHeaders() })
  }

  // دالة مساعدة للحصول على User ID من الـ Token
  getCurrentUserId(): string {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      if (!token) return '';
      
      const decodedToken: any = jwtDecode(token);
      
      // الـ User ID ممكن يكون بأسماء مختلفة
      return decodedToken.sub || 
             decodedToken.userId || 
             decodedToken.nameid ||
             decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
             '';
    } catch (error) {
      console.error('Error getting user ID:', error);
      return '';
    }
  }

  // دالة للتحقق من صلاحية الـ Token
  isTokenValid(): boolean {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      if (!token) return false;
      
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      return decodedToken.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
}