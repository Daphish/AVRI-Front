import { NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css'
})
export class LoginModalComponent {
  constructor(private authService: AuthService){}

  username : string = "Daphish";
  truePass : string = "12345";
  
  user : string = "";
  password : string = "";
  error : boolean = false;

  @Output() closeModalEvent = new EventEmitter<void>();

  closeModal() {
    this.closeModalEvent.emit();
  }

  startSession() {
    if (this.user === this.username && this.password === this.truePass){
      this.authService.login();
      this.closeModal();
    } else {
      this.error = true;
      setTimeout(() => {
        this.error = false;
      }, 2000);
    }
  }
}
