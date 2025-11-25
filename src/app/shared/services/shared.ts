import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private isOpenSubject = new BehaviorSubject<boolean>(true);
  public isOpen$ = this.isOpenSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  refreshToken(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(
      `${environment.authUrl}RefreshToken`,
      {
        headers,
        responseType: 'text'
      }
    )
  }


  isTokenExpired(): boolean {
    const token = localStorage.getItem('NHC_PL_Token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  }

  // ✅ Auto refresh token before expiry
  scheduleTokenRefresh(): void {
    const token = localStorage.getItem('NHC_PL_Token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;

      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000);

      if (refreshTime > 0) {
        setTimeout(() => {
          this.refreshToken().subscribe({
            next: () => {
              console.log('✅ Token auto-refreshed');
              this.scheduleTokenRefresh(); // Schedule next refresh
            },
            error: (err) => {
              console.error('❌ Auto-refresh failed:', err);
            }
          });
        }, refreshTime);
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  toggle() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  open() {
    this.isOpenSubject.next(true);
  }

  close() {
    this.isOpenSubject.next(false);
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}
