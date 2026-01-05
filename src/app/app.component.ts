import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SharedService } from './shared/services/shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  isMobile = false;
  showLayout = true;

  // ✅ الصفحات اللي مش عايز فيها Layout
  private noLayoutRoutes: string[] = [
    '/auth',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ];

  constructor(public sidenavService: SharedService, private router: Router) {}

  ngOnInit() {
    this.checkScreenSize();
    
    // ✅ Check route on navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkLayout(event.url);
      });
    
    // ✅ Check initial route
    this.checkLayout(this.router.url);

    // const token = localStorage.getItem("NHC_PL_Token");
    // if (!token)
    //   this.router.navigate(["/auth/login"])
    // else {
    //   this.sidenavService.refreshToken().subscribe({
    //     next: token => {
    //       localStorage.removeItem('NHC_PL_Token')
    //       localStorage.setItem('NHC_PL_Token', token);
    //     },
    //     error: err => {
    //       console.error('❌ Error refreshing token', err);
    //     }
    //   });
    // }
  }

  // ✅ Check if current route needs layout
  private checkLayout(url: string): void {
    this.showLayout = !this.noLayoutRoutes.some(route => url.startsWith(route));
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