import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav implements OnInit {
  role: string | null = null;
 isMobile: boolean = false;
  constructor(public sidenavService: SharedService) { }

  ngOnInit(): void {
    this.role = localStorage.getItem("NHC_PL_Role");
      this.checkScreenSize();
  }
  onResize() {
    this.checkScreenSize();
  }
  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
  }
  isDropdownOpen = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }


 
}
