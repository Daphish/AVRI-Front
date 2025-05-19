// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  AsyncPipe,
  NgClass,
  NgFor,
  NgIf,
  UpperCasePipe,
} from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription, map } from 'rxjs';

import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Chat } from '../../interfaces/chat.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LoginModalComponent, NgIf, NgFor, AsyncPipe, UpperCasePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  private subs = new Subscription();

  isModalOpen = false;

  /* ------------ streams para la plantilla ------------ */
  isLoggedIn$: Observable<boolean> = this.authService.isLoggedIn$;
  chats$: Observable<Chat[]> = this.chatService.sessions$;

  currentUserName$: Observable<string> = this.authService.currentUser$.pipe(
    map((user) => {
      if (user) {
        if ('anonymous_id' in user) return 'Invitado';
        return (user as User).first_name || (user as User).name || 'Usuario';
      }
      return 'Invitado';
    })
  );
  currentUserInitial$: Observable<string> = this.currentUserName$.pipe(
    map((n) => (n ? n.charAt(0) : '?'))
  );

  /* ---------------- ciclo de vida ---------------- */
  ngOnInit() {
    this.authService.autoLogin(); // auto-login al iniciar
    this.subs.add(
      this.authService.isLoggedIn$.subscribe((loggedIn) => {
        const current = this.authService.getCurrentUserSnapshot();
        if (loggedIn && current && !('anonymous_id' in current)) {
          this.chatService.loadSessions();
          this.isModalOpen = false;
        }
        if (!loggedIn) {
          this.chatService.clearSessions();
          this.isModalOpen = true;
          console.log('No hay sesión');
        }
      })
    );
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /* ---------------- acciones UI ---------------- */
  viewHome() {
    this.subs.add(
      this.chatService.createSession().subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => console.error('Error creando sesión:', err),
      })
    );
  }
  loadMessages(id: string) {
    this.chatService.loadMessages(id);
    this.router.navigate(['/home']);
  }
  deleteChat(id: string, ev?: Event) {
    ev?.stopPropagation(); // evitar que se abra el chat al borrar
    if (confirm('¿Eliminar esta conversación?')) {
      this.chatService.deleteSession(id);
    }
  }

  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }
  viewProfile() {
    this.router.navigate(['/profile']);
  }
}
