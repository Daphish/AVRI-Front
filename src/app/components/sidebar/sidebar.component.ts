import { Component, OnInit } from '@angular/core';
import { LoginModalComponent } from "../login-modal/login-modal.component";
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LoginModalComponent, NgIf, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  isModalOpen = false;
  isLoggedIn = false;

  constructor(private authService: AuthService, private router: Router){}

  ngOnInit(){
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  viewHome() {
    this.router.navigate(['home']);
  }

  viewProfile() {
    this.router.navigate(['profile']);
  }
}
