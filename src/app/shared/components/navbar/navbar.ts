import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared';
import { ToastrService } from 'ngx-toastr';
import { trigger, state, style, animate, transition } from '@angular/animations'
import { MessagesService } from '../../../messages/services/messages.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  animations: [
    // Fade animation for overlay
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    // Dropdown animation - different for mobile and desktop
    trigger('dropdownAnimation', [
      // Desktop - fade and slide down
      transition('void => desktop', [
        style({
          opacity: 0,
          transform: 'translateY(-10px) scale(0.95)'
        }),
        animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }))
      ]),
      transition('desktop => void', [
        animate('150ms ease-in', style({
          opacity: 0,
          transform: 'translateY(-10px) scale(0.95)'
        }))
      ]),
      // Mobile - slide up from bottom
      transition('void => mobile', [
        style({
          transform: 'translateY(100%)'
        }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({
          transform: 'translateY(0)'
        }))
      ]),
      transition('mobile => void', [
        animate('250ms ease-in', style({
          transform: 'translateY(100%)'
        }))
      ])
    ])
  ]
})
export class Navbar implements OnInit {
  token: string | null = null;
  isProfileMenuOpen = false;
  isMobile = false;
  messages: any[] = [];

  @ViewChild('profileMenu') profileMenu!: ElementRef;

  constructor(
    public sidenavService: SharedService,
    private toastr: ToastrService,
    private router: Router,
      private messageService: MessagesService,
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem("NHC_PL_Token");
    this.checkScreenSize();
    this.loadMessages();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 640;
  }

  loadMessages(): void {
    this.messageService.getMyMessages().subscribe({
      next: (response: any) => {
        this.messages = response.data;
      }
    });
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;

    // Prevent body scroll when menu is open on mobile
    if (this.isMobile) {
      document.body.style.overflow = this.isProfileMenuOpen ? 'hidden' : '';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu-container')) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.closeMenu();
  }

  private closeMenu() {
    if (this.isProfileMenuOpen) {
      this.isProfileMenuOpen = false;
      document.body.style.overflow = '';
    }
  }

  logout() {
    localStorage.removeItem('NHC_PL_Token');
    localStorage.removeItem('NHC_PL_Role');
    this.closeMenu();
    this.toastr.info("تم تسجيل الخروج من حسابك");
    this.router.navigate(['/auth/login']);
  }


  get unreadCount(): number {
    var count = this.messages.filter(msg => !msg.isRead).length;
    return count;
  }

}
