import { NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent {
  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  user: string = '';
  password: string = '';
  loggingIn: boolean = false;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  /* ---------- método para mostrar toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  @Output() closeModalEvent = new EventEmitter<void>();

  closeModal() {
    this.closeModalEvent.emit();
  }

  startSession() {
    this.loggingIn = true;
    this.authService.login(this.user, this.password).then((success) => {
      this.loggingIn = false;
      if (success) {
        this.chatService.loadSessions();
        this.closeModal();
        this.showToastMessage('Sesión iniciada correctamente.', 'success');
      } else {
        this.showToastMessage('Credenciales incorrectas.');
      }
    })
     .catch((error) => {
      this.loggingIn = false;
      console.error('Error al iniciar sesión:', error);
      this.showToastMessage('Error al conectar con el servidor.');
    });
  }

  continueAsGuest() {
    this.loggingIn = true;
    this.authService.createAnonymous().then((success) => {
      this.loggingIn = false;
      if (success) {
        this.closeModal();
        this.showToastMessage('Sesión anónima iniciada.', 'success');
      } else {
        this.showToastMessage('Error al crear sesión anónima.');
      }
    })
    .catch((error) => {
      this.loggingIn = false;
      console.error('Error al crear sesión anónima:', error);
      this.showToastMessage('Error al conectar con el servidor.');
    });
  }
}
