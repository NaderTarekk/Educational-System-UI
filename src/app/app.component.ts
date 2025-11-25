import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, filter, Observable, switchMap, throwError } from 'rxjs';
import { SharedService } from './shared/services/shared';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  isMobile = false;
  showLayout = true;

  constructor(public sidenavService: SharedService, private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // لو الصفحة هي login → أخفي الـ layout
        this.showLayout = !event.url.includes('/auth/login');
      });
  }

  ngOnInit() {
    const token = localStorage.getItem("NHC_PL_Token");
    if (!token)
      this.router.navigate(["/auth/login"])
    else {
      this.sidenavService.refreshToken().subscribe({
        next: token => {
          localStorage.removeItem('NHC_PL_Token')
          localStorage.setItem('NHC_PL_Token', token);
        },
        error: err => {
          console.error('❌ Error refreshing token', err);
        }
      });

    }
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 1024;

    // فتح/إغلاق تلقائي عند تغيير حجم الشاشة
    if (wasMobile !== this.isMobile) {
      if (this.isMobile) {
        this.sidenavService.close();
      } else {
        this.sidenavService.open();
      }
    }
  }
}
