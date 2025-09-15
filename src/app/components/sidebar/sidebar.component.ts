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
  imports: [
    LoginModalComponent,
    NgIf,
    NgClass,
    NgFor,
    AsyncPipe,
    UpperCasePipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  private subs = new Subscription();
  activeSessionId: string | null = null;
  isModalOpen = false;

  /* ---------- loading states ---------- */
  deletingChatId: string | null = null; 
  loadingSessions = false;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  /* ---------- método para mostrar toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    const timeout = type === 'warning' ? 8000 : 4000; // Más tiempo para confirmar
    
    setTimeout(() => {
      if (this.showToast && this.toastType === type) {
        this.showToast = false;
        if (type === 'warning') {
          this.pendingDeleteId = null; // Limpiar si no confirmó
        }
      }
    }, timeout);
  }

  /* ------------ streams para la plantilla ------------ */
  isLoggedIn$: Observable<boolean> = this.authService.isLoggedIn$;
  chats$: Observable<Chat[]> = this.chatService.sessions$;

  currentUserName$: Observable<string> = this.authService.currentUser$.pipe(
    map((user) => {
      if (user) {
        if ('anonymous_id' in user) return 'Invitado';
        return (user as User).name || 'Usuario';
      }
      return 'Invitado';
    })
  );
  currentUserInitial$: Observable<string> = this.currentUserName$.pipe(
    map((n) => (n ? n.charAt(0) : '?'))
  );

  /* ---------------- ciclo de vida ---------------- */
  ngOnInit() {
    try {
      this.authService.autoLogin();
    } catch (error) {
      console.error('Error en auto-login:', error);
      this.showToastMessage('Error al verificar sesión.');
    }

    this.subs.add(
      this.authService.isLoggedIn$.subscribe((loggedIn) => {
        const current = this.authService.getCurrentUserSnapshot();
        if (loggedIn && current && !('anonymous_id' in current)) {
          this.loadingSessions = true; 
          try {
            this.chatService.loadSessions();
            this.loadingSessions = false; 
            this.isModalOpen = false;
          } catch (error) {
            this.loadingSessions = false; 
            console.error('Error al cargar sesiones:', error);
            this.showToastMessage('Error al cargar conversaciones.');
          }
        }
        if (!loggedIn) {
          this.chatService.clearSessions();
          this.isModalOpen = true;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /* ---------------- acciones UI ---------------- */
  viewHome() {
    this.chatService.clearIdChat();
    this.router.navigate(['/home']);
  }

  loadMessages(id: string) {
    try {
      this.activeSessionId = id;
      this.chatService.loadMessages(id);
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      this.showToastMessage('Error al cargar la conversación.');
    }
  }

  /* ---------- confirmación para eliminar ---------- */
  pendingDeleteId: string | null = null;

  deleteChat(id: string, ev?: Event) {
    ev?.stopPropagation();
    
  // Guardar el ID que se quiere eliminar y mostrar warning
    this.pendingDeleteId = id;
    this.showToastMessage('¿Eliminar esta conversación? Toca para confirmar.', 'warning');
  }

  // Método para confirmar eliminación
  confirmDelete() {
    if (this.pendingDeleteId) {
      this.deletingChatId = this.pendingDeleteId;
      
      try {
        this.chatService.deleteSession(this.pendingDeleteId);
        this.deletingChatId = null;
        this.pendingDeleteId = null;
        this.showToastMessage('Conversación eliminada.', 'success');
      } catch (error) {
        console.error('Error al eliminar chat:', error);
        this.showToastMessage('Error al eliminar la conversación.');
        this.deletingChatId = null;
      }
    }
    this.showToast = false;
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
