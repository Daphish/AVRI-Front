import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser }                          from '@angular/common';
import { RouterOutlet }                               from '@angular/router';

import { AuthService }    from './services/auth.service';
import { ChatService }    from './services/chat.service';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    LoginModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private chat    = inject(ChatService);
  private platformId = inject(PLATFORM_ID);

  // Arranca mostrando el modal de login/opción invitado
  showLoginModal = false;

  ngOnInit(): void {
    // Solo en cliente (evita SSR issues)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Mostrar modal para login o invitado antes de cualquier petición
    this.showLoginModal = true;
  }

  // Tras cerrar el modal (login o invitado), cargamos sesiones
  onCloseLogin() {
    this.showLoginModal = false;
    this.chat.loadSessions();
  }
}