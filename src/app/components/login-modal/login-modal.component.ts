import { NgIf, NgStyle } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [NgIf, FormsModule, NgStyle],
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
  name: string = '';
  firstName: string = '';
  lastName: string = '';
  is_author: boolean = false;
  loggingIn: boolean = false;
  register: boolean = false;
  registering: boolean = false;

  /* ---------- email validation ---------- */
  emailTouched: boolean = false;
  
  // Email validation regex
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  /* ---------- method for showing toast ---------- */
  private showToastMessage(
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) {
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

  /* ---------- email validation methods ---------- */
  isEmailValid(): boolean {
    return this.EMAIL_REGEX.test(this.user.trim());
  }

  showEmailError(): boolean {
    return this.emailTouched && this.user.length > 0 && !this.isEmailValid();
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onEmailInput(): void {
    if (!this.emailTouched && this.user.length > 0) {
      this.emailTouched = true;
    }
  }

  canSubmitLogin(): boolean {
    return this.user.trim() !== '' && 
           this.password.trim() !== '' && 
           this.isEmailValid();
  }

  canSubmitRegister(): boolean {
    return this.name.trim() !== '' &&
           this.firstName.trim() !== '' &&
           this.lastName.trim() !== '' &&
           this.user.trim() !== '' && 
           this.password.trim() !== '' && 
           this.isEmailValid();
  }

  startSession() {
    this.loggingIn = true;
    this.authService
      .login(this.user, this.password)
      .then((success) => {
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
    this.authService
      .createAnonymous()
      .then((success) => {
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

  toggleRegisterModal() {
    this.register = !this.register;
    this.user = '';
    this.password = '';
    this.name = '';
    this.firstName = '';
    this.lastName = '';
    this.is_author = false;
    this.password = '';
    this.emailTouched = false; // Reset email validation state
  }

  registerUser() {
    this.registering = true;
    this.authService
      .registerUser(
        this.name,
        this.firstName,
        this.lastName,
        this.is_author,
        this.user,
        this.password
      )
      .then((success) => {
        this.registering = false;
        if (success) {
          this.toggleRegisterModal();
          this.showToastMessage(
            'Registro completado correctamente.',
            'success'
          );
        } else {
          this.showToastMessage('Error al registrar usuario.');
        }
      })
      .catch((error) => {
        this.registering = false;
        console.error('Error al registrar un nuevo usuario: ', error);
        this.showToastMessage('Error al conectar con el servidor.');
      });
  }
}
