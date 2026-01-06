import { ChangeDetectorRef, Component, HostListener, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SharedService } from '../../services/shared';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MessagesService } from '../../../messages/services/messages.service';

@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav implements OnInit {
  @ViewChild('navContainer') navContainer!: ElementRef;

  role: string | null = null;
  isMobile: boolean = false;
  messages: any[] = [];

  // 🎯 Sliding Highlight Properties
  highlightTop: number = 0;
  highlightHeight: number = 0;
  highlightVisible: boolean = false;
  highlightGradient: string = 'linear-gradient(135deg, #3b82f6, #6366f1)';

  private hoverTimeout: any;

  constructor(
    public sidenavService: SharedService, 
    private messageService: MessagesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.role = localStorage.getItem("NHC_PL_Role");
    this.checkScreenSize();
    this.loadMessages();

    // ✅ Update highlight on route change
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.updateActiveHighlight(), 100);
      });

    // ✅ Initial highlight position
    setTimeout(() => this.updateActiveHighlight(), 300);
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
    setTimeout(() => this.updateActiveHighlight(), 100);
  }

  // 🎯 Handle mouse hover on nav items
  onNavHover(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    const navRect = this.navContainer?.nativeElement.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (navRect) {
      this.highlightTop = targetRect.top - navRect.top + this.navContainer.nativeElement.scrollTop;
      this.highlightHeight = targetRect.height;
      this.highlightGradient = target.getAttribute('data-gradient') || 'linear-gradient(135deg, #3b82f6, #6366f1)';
      this.highlightVisible = true;
    }
  }

  // 🎯 Handle mouse leave
  onNavLeave(): void {
    this.hoverTimeout = setTimeout(() => {
      this.updateActiveHighlight();
    }, 150);
  }

  // 🎯 Update highlight to active link position
  private updateActiveHighlight(): void {
    const activeLink = this.navContainer?.nativeElement.querySelector('.active-link') as HTMLElement;
    
    if (activeLink && this.navContainer) {
      const navRect = this.navContainer.nativeElement.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();

      this.highlightTop = activeRect.top - navRect.top + this.navContainer.nativeElement.scrollTop;
      this.highlightHeight = activeRect.height;
      this.highlightGradient = activeLink.getAttribute('data-gradient') || 'linear-gradient(135deg, #3b82f6, #6366f1)';
      this.highlightVisible = true;
    } else {
      this.highlightVisible = false;
    }
  }

  isDropdownOpen = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  loadMessages(): void {
    this.messageService.getMyMessages().subscribe({
      next: (response: any) => {
        this.messages = response.data;
      }
    });
  }

  get unreadCount(): number {
    var count = this.messages.filter(msg => !msg.isRead).length;
    return count;
  }
}