import { Component, OnInit } from '@angular/core';
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

  constructor(public sidenavService: SharedService, private toastr: ToastrService, private router: Router) { }

  ngOnInit(): void {
    this.token = localStorage.getItem("NHC_PL_Token");
  }

  logout() {
    localStorage.removeItem('NHC_PL_Token')
    localStorage.removeItem('NHC_PL_Role')
    this.toastr.info("تم تسجيل الخروج من حسابك")
    this.router.navigate(['/auth/login'])
  }
}
