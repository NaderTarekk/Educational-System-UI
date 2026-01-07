import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  token: string | null = null;
  isProfileMenuOpen = false;
  isMobile = false;

  @ViewChild('profileMenu') profileMenu!: ElementRef;

  constructor(public sidenavService: SharedService, private toastr: ToastrService, private router: Router) { }

  ngOnInit(): void {
    this.token = localStorage.getItem("NHC_PL_Token");
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 640;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu-container')) {
      this.isProfileMenuOpen = false;
    }
  }

  logout() {
    localStorage.removeItem('NHC_PL_Token')
    localStorage.removeItem('NHC_PL_Role')
    this.isProfileMenuOpen = false;
    this.toastr.info("تم تسجيل الخروج من حسابك")
    this.router.navigate(['/auth/login'])
  }
}
