// src/app/core/interceptors/auth.interceptor.ts

import { Inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/components/auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor(@Inject(AuthService) private authService: AuthService, @Inject(Router) private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler) {
        // ✅ أضف التوكن لكل Request
        const token = localStorage.getItem('NHC_PL_Token');
        if (token) {
            req = this.addToken(req, token);
        }
        else {
            this.router.navigate(['/auth/login']);
        }

        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                // ✅ لو 401 (Unauthorized) → جرب Refresh
                if (error.status === 401 && !req.url.includes('/refresh')) {
                    return this.handle401Error(req, next);
                }
                return throwError(() => error);
            })
        );
    }

    private addToken(req: HttpRequest<any>, token: string) {
        return req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    private handle401Error(req: HttpRequest<any>, next: HttpHandler) {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            const accessToken = localStorage.getItem('NHC_PL_Token');
            const refreshToken = localStorage.getItem('NHC_PL_RefreshToken');

            if (accessToken && refreshToken) {
                return this.authService.refreshToken(accessToken, refreshToken).pipe(
                    switchMap((res: any) => {
                        this.isRefreshing = false;
                        localStorage.setItem('NHC_PL_Token', res.token);
                        localStorage.setItem('NHC_PL_RefreshToken', res.refreshToken);
                        this.refreshTokenSubject.next(res.token);
                        return next.handle(this.addToken(req, res.token));
                    }),
                    catchError((err) => {
                        this.isRefreshing = false;
                        localStorage.clear();
                        this.router.navigate(['/auth/login']);
                        return throwError(() => err);
                    })
                );
            }
        }

        return this.refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next.handle(this.addToken(req, token!)))
        );
    }
}