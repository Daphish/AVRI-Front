import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  /** Regresa al chat y dispara el cuestionario */
  goBack(): void {
    this.chatService.pendingWizard = true;   // <-- mostrará wizard al volver
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.chatService.clearSessions();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
