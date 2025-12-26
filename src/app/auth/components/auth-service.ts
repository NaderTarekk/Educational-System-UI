// src/auth/components/auth-service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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

      const decodedToken: any = jwtDecode(token);

      const role = decodedToken.role ||
        decodedToken.Role ||
        decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        '';

      console.log('👤 User Role:', role);
      return role || '';

    } catch (error) {
      console.error('Error decoding token:', error);
      return '';
    }
  }

  refreshToken(id: string) {
    return this.http.get<any>(`${environment.authUrl}RefreshToken?id=${id}`, { headers: this.getHeaders() })
  }

  // ✅ دالة محسّنة للحصول على User ID من الـ Token
  getCurrentUserId(): string {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      if (!token) {
        console.warn('⚠️ No token found');
        return '';
      }

      const decodedToken: any = jwtDecode(token);

      // طباعة كل الـ Token للـ debugging
      console.log('🔍 Decoded Token:', decodedToken);

      // ⬅️ جرب كل الاحتمالات الممكنة (مع التركيز على "Id" بحرف كبير)
      const userId = decodedToken.Id ||           // ⬅️ هذا هو المفتاح الصحيح حسب Token بتاعك
        decodedToken.id ||
        decodedToken.sub ||
        decodedToken.userId ||
        decodedToken.nameid ||
        decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        '';

      console.log('🆔 Extracted User ID:', userId);

      if (!userId) {
        console.error('❌ Could not extract user ID from token');
        console.log('Available claims:', Object.keys(decodedToken));
      }

      return userId;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
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
      console.error('Error validating token:', error);
      return false;
    }
  }

  // ✅ دالة إضافية للحصول على الـ User Email
  getCurrentUserEmail(): string {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      if (!token) return '';

      const decodedToken: any = jwtDecode(token);

      return decodedToken.Email ||
        decodedToken.email ||
        decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        '';
    } catch (error) {
      console.error('Error getting user email:', error);
      return '';
    }
  }

  // ✅ دالة للحصول على كل بيانات الـ User من الـ Token
  getCurrentUser(): any {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      if (!token) return null;

      const decodedToken: any = jwtDecode(token);

      return {
        id: this.getCurrentUserId(),
        email: this.getCurrentUserEmail(),
        role: this.getCurrentUserRole(),
        fullToken: decodedToken
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}