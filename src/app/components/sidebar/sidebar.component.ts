// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
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
import { ModalService } from '../../services/modal.service';
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
  private modalService = inject(ModalService);
  private router = inject(Router);
  private subs = new Subscription();
  activeSessionId: string | null = null;
  isModalOpen = false;
  isDropdownOpen = false;

  /* ---------- loading states ---------- */
  deletingChatId: string | null = null; 
  loadingSessions = false;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  /* ---------- method for showing toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    const timeout = type === 'warning' ? 8000 : 4000;
    
    setTimeout(() => {
      if (this.showToast && this.toastType === type) {
        this.showToast = false;
        if (type === 'warning') {
          this.pendingDeleteChat = null;
        }
      }
    }, timeout);
  }

  /* ------------ template streams ------------ */
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

  /* ---------------- life cycle ---------------- */
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
            this.modalService.closeModal();
          } catch (error) {
            this.loadingSessions = false; 
            console.error('Error al cargar sesiones:', error);
            this.showToastMessage('Error al cargar conversaciones.');
          }
        }
        if (!loggedIn) {
          this.chatService.clearSessions();
          this.isModalOpen = true;
          this.modalService.openModal();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /* ---------------- UI actions ---------------- */
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

  /* ---------- deleting confirmation ---------- */
  pendingDeleteChat: { id: string; name: string } | null = null;

  deleteChat(chat: Chat, ev?: Event) {
    ev?.stopPropagation();
    this.pendingDeleteChat = {id: chat.session_id, name: chat.session_name};
    this.showToastMessage('¿Eliminar esta conversación?', 'warning');
  }

  // Confirming deletion
  confirmDelete() {
    if (this.pendingDeleteChat) {
      this.deletingChatId = this.pendingDeleteChat.id;
      
      try {
        this.chatService.deleteSession(this.pendingDeleteChat.id);
        this.showToast = false;
        this.deletingChatId = null;
        this.pendingDeleteChat = null;
        this.showToastMessage('Conversación eliminada.', 'success');
      } catch (error) {
        console.error('Error al eliminar chat:', error);
        this.showToastMessage('Error al eliminar la conversación.');
        this.deletingChatId = null;
        this.pendingDeleteChat = null;
      }
    }
  }

  cancelDelete() {
    this.showToast = false;
    this.pendingDeleteChat = null;
  }

  openModal() {
    this.isModalOpen = true;
    this.modalService.openModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalService.closeModal();
  }

  viewProfile() {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  /* ---------------- dropdown methods ---------------- */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  async closeSession(): Promise<void> {
    try {
      this.chatService.clearSessions();
      this.authService.logout();
      await this.router.navigate(['/home']);
      this.closeDropdown();
    } catch (error) {
      console.error('Error closing session:', error);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdownContainer = target.closest('.account-dropdown-container');
    
    if (!dropdownContainer && this.isDropdownOpen) {
      this.closeDropdown();
    }
  }
}