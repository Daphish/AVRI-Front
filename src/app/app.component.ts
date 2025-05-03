import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom }    from 'rxjs';
import { RouterOutlet }      from '@angular/router';

import { AuthService }          from './services/auth.service';
import { ChatService }          from './services/chat.service';
import { HeaderComponent }      from './components/header/header.component';
import { SidebarComponent }     from './components/sidebar/sidebar.component';
import { LoginModalComponent }  from './components/login-modal/login-modal.component';

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
  private auth      = inject(AuthService);
  private chat      = inject(ChatService);
  private platformId = inject(PLATFORM_ID);

  showLoginModal = false;

  async ngOnInit(): Promise<void> {
    // Solo en navegador para evitar errors SSR
    if (!isPlatformBrowser(this.platformId)) return;

    // Intentar reactivar sesión si hay token
    await this.auth.autoLogin();

    // Basado en estado, mostrar modal o cargar sesiones
    const loggedIn = await firstValueFrom(this.auth.isLoggedIn$);
    if (loggedIn) {
      this.chat.loadSessions();
      this.showLoginModal = false;
    } else {
      this.showLoginModal = true;
    }
  }

  /** Al cerrar el modal (login o invitado) */
  onCloseLogin(): void {
    this.showLoginModal = false;
    this.chat.loadSessions();
  }
}
