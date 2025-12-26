import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared';
import { BehaviorSubject } from 'rxjs';
import { MessagesService } from '../../../messages/services/messages.service';

@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav implements OnInit {
  role: string | null = null;
  isMobile: boolean = false;
  messages: any[] = [];

  constructor(public sidenavService: SharedService, private messageService: MessagesService) { }

  ngOnInit(): void {
    this.role = localStorage.getItem("NHC_PL_Role");
    this.checkScreenSize();
    this.loadMessages()
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
