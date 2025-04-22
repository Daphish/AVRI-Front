import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent {
  user = '';
  password = '';
  error = false;

  @Output() closeModalEvent = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  async startSession(): Promise<void> {
    this.error = !(await this.auth.login(this.user, this.password));
    if (!this.error) {
      this.closeModalEvent.emit();
    }
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
