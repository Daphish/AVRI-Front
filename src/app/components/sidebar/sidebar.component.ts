import { Component, OnInit }    from '@angular/core';
import { LoginModalComponent }  from '../login-modal/login-modal.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AuthService }          from '../../services/auth.service';
import { Router }               from '@angular/router';
import { Chat }                 from '../../interfaces/chat.interface';
import { ChatService }          from '../../services/chat.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LoginModalComponent, NgIf, NgClass, NgFor],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isModalOpen     = false;
  isLoggedIn      = false;
  chats: Chat[]   = [];
  currentUserName = 'Invitado';

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1) Siempre suscribirse a sessions$
    this.chatService.sessions$.subscribe(list => this.chats = list);

    // 2) Atender login/logout
    this.authService.isLoggedIn$
      .subscribe(loggedIn => {
        this.isLoggedIn = loggedIn;

        if (loggedIn) {
          // Cargar nombre y sesiones del usuario
          this.authService.currentUser$
            .subscribe(user => {
              this.currentUserName = user?.first_name || 'Usuario';
            });
          this.chatService.loadSessions();
        } else {
          // Invitado: nombre y limpiar sesiones memorizadas
          this.currentUserName = 'Invitado';
          this.chatService.clearSessions();
        }
      });
  }

  viewHome() {
    this.chatService.createSession()
      .subscribe(() => this.router.navigate(['/home']));
  }

  loadMessages(sessionId: string) {
    this.chatService.loadMessages(sessionId);
    this.router.navigate(['/home']);
  }

  openModal()  { this.isModalOpen = true; }
  closeModal() { this.isModalOpen = false; }
  viewProfile() { this.router.navigate(['/profile']); }
}
