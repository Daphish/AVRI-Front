import { Component, OnInit } from '@angular/core';
import { LoginModalComponent } from "../login-modal/login-modal.component";
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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

  constructor(private authService: AuthService){}

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
}
