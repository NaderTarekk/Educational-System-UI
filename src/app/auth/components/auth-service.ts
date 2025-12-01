import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { tap } from 'rxjs';

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
    console.log(environment.authUrl);
    
    return this.http.post(environment.authUrl + "login", form)
  }

  refreshToken(id: string) {
    return this.http.get<any>(`${environment.authUrl}api/Auth/RefreshToken?id=${id}`, { headers: this.getHeaders() })
  }
}
