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
  isScrolled = false; // ✅ جديد - للـ navbar blur

  private noLayoutRoutes: string[] = [
    '/auth',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ];

  constructor(public sidenavService: SharedService, private router: Router) {}

  ngOnInit() {
    this.checkScreenSize();
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkLayout(event.url);
        
        // ✅ جديد - Close sidenav on mobile when navigating
        if (this.isMobile) {
          this.sidenavService.close();
        }
        
        // ✅ جديد - Scroll to top on route change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    
    this.checkLayout(this.router.url);
  }

  private checkLayout(url: string): void {
    this.showLayout = !this.noLayoutRoutes.some(route => url.startsWith(route));
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  // ✅ جديد - Listen for scroll
  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  // ✅ جديد - Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd + B to toggle sidenav
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      this.sidenavService.toggle();
    }
    
    // Escape to close sidenav on mobile
    if (event.key === 'Escape' && this.isMobile) {
      this.sidenavService.close();
    }
  }

  private checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 1024;

    if (wasMobile !== this.isMobile) {
      if (this.isMobile) {
        this.sidenavService.close();
      } else {
        this.sidenavService.open();
      }
    }
  }
}