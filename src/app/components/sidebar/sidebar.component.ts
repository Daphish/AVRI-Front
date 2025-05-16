// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf, UpperCasePipe } from '@angular/common'; // UpperCasePipe añadido
import { Router } from '@angular/router';
import { Observable, Subscription, map } from 'rxjs';

import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Chat } from '../../interfaces/chat.interface';
import { User } from '../../interfaces/user.interface'; // AnonymousUser se infiere por la estructura

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LoginModalComponent, NgIf, NgClass, NgFor, AsyncPipe, UpperCasePipe], // UpperCasePipe añadido
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  isModalOpen = false;

  // Observables para la plantilla
  isLoggedIn$: Observable<boolean> = this.authService.isLoggedIn$;
  chats$: Observable<Chat[]> = this.chatService.sessions$;

  currentUserName$: Observable<string> = this.authService.currentUser$.pipe(
    map(user => {
      if (user) {
        if ('anonymous_id' in user) { // Es AnonymousUser
          return 'Invitado';
        }
        // Es User, usa first_name o name como fallback. El archivo que me pasaste tiene 'name' en User.
        return (user as User).first_name || (user as User).name || 'Usuario';
      }
      return 'Invitado'; // Si user es null
    })
  );

  currentUserInitial$: Observable<string> = this.currentUserName$.pipe(
    map(name => (name && name.length > 0 ? name.charAt(0) : '?'))
    // El pipe uppercase se aplicará en la plantilla
  );

  ngOnInit() {
    this.subscriptions.add(
      this.authService.isLoggedIn$.subscribe(loggedIn => {
        // Usar el snapshot para una lógica que depende del valor actual síncrono
        const currentUser = this.authService.getCurrentUserSnapshot();
        if (loggedIn && currentUser && !('anonymous_id' in currentUser)) {
          this.chatService.loadSessions();
        } else {
          this.chatService.clearSessions();
        }
        // No se maneja isModalOpen aquí para evitar comportamientos inesperados al cambiar el estado de login.
        // La apertura inicial del modal puede ser manejada por AppComponent o interacciones del usuario.
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  viewHome() {
    this.subscriptions.add(
      this.chatService.createSession().subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => console.error('Error creando sesión en sidebar:', err)
      })
    );
  }

  loadMessages(sessionId: string) {
    this.chatService.loadMessages(sessionId);
    this.router.navigate(['/home']);
  }

  openModal() { this.isModalOpen = true; }
  closeModal() {
    this.isModalOpen = false;
    // AuthService actualiza isLoggedIn$ y currentUser$ tras login/invitado exitoso.
    // La suscripción en ngOnInit reaccionará a estos cambios.
  }
  viewProfile() { this.router.navigate(['/profile']); }
}