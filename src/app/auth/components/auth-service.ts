// src/auth/components/auth-service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { Observable, tap } from 'rxjs';
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

  // ✅ Login
  Login(form: any): Observable<any> {
    return this.http.post(environment.authUrl + "login", form);
  }

  // ✅ Register - مع PhoneNumber
  Register(form: any): Observable<any> {
    return this.http.post(environment.authUrl + "register", form);
  }

  // ✅ جديد - نسيت كلمة المرور
  ForgotPassword(email: string): Observable<any> {
    return this.http.post(environment.authUrl + "forgot-password", { email });
  }

  // ✅ جديد - التحقق من الكود
  VerifyResetCode(email: string, code: string): Observable<any> {
    return this.http.post(environment.authUrl + "verify-reset-code", { email, code });
  }

  // ✅ جديد - إعادة تعيين كلمة المرور
  ResetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(environment.authUrl + "reset-password", data);
  }

  // ✅ Refresh Token
  refreshToken(accessToken: string, refreshToken: string): Observable<any> {
    return this.http.post(`${environment.authUrl}RefreshToken`, {
      accessToken,
      refreshToken
    });
  }

  // ✅ Get Current User Role
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

  // ✅ Get Current User ID
  getCurrentUserId(): string {
    try {
      const token = localStorage.getItem('NHC_PL_Token');
      if (!token) {
        console.warn('⚠️ No token found');
        return '';
      }

      const decodedToken: any = jwtDecode(token);

      console.log('🔍 Decoded Token:', decodedToken);

      const userId = decodedToken.Id ||
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

  // ✅ Check Token Validity
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

  // ✅ Get Current User Email
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

  // ✅ Get Current User (All Data)
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

  // ✅ Logout
  logout(): void {
    localStorage.removeItem('NHC_PL_Token');
    localStorage.removeItem('NHC_PL_RefreshToken');
    localStorage.removeItem('NHC_PL_Role');
  }

  // ✅ Check if Logged In
  isLoggedIn(): boolean {
    return this.isTokenValid();
  }
}