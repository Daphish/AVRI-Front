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

  logout(): void {
    // 1) Limpiar sesiones de chat en memoria (invitado o usuario)
    this.chatService.clearSessions();
    // 2) Cerrar sesión en el AuthService
    this.authService.logout();
    // 3) Redirigir al login
    this.router.navigate(['/login']);
  }
}
