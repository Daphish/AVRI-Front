import { NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css'
})
export class LoginModalComponent {

  username : string = "Daphish";
  truePass : string = "12345";
  
  user : string = "";
  password : string = "";
  loggedIn : boolean = false;
  error : boolean = false;

  @Output() closeModalEvent = new EventEmitter<void>();

  closeModal() {
    this.closeModalEvent.emit();
  }

  startSession() {
    if (this.user === this.username && this.password === this.truePass){
      this.loggedIn = true;
    } else {
      setTimeout(() => {
        this.error = true;
      }, 2000);
    }
  }
}
