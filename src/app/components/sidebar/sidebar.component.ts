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

  /* ---------- delete confirmation modal ---------- */
  showDeleteModal = false;
  chatToDelete: { id: string; name: string } | null = null;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  /* ---------- method for showing toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
        this.showToast = false;
    }, 4000);
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
      this.showToastMessage('Error al verificar sesión.', 'error');
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
            this.showToastMessage('Error al cargar conversaciones.', 'error');
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
      this.showToastMessage('Error al cargar la conversación.', 'error');
    }
  }

  /* ---------- delete confirmation modal ---------- */
  openDeleteModal(chat: Chat, ev?: Event) {
    ev?.stopPropagation();
    this.chatToDelete = {
      id: chat.session_id,
      name: chat.session_name
    };
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.chatToDelete = null;
  }

  confirmDelete() {
    if (this.chatToDelete) {
      this.deletingChatId = this.chatToDelete.id;
      
      try {
        this.chatService.deleteSession(this.chatToDelete.id);
        this.showDeleteModal = false;
        this.chatToDelete = null;
        this.deletingChatId = null;
        this.showToastMessage('Conversación eliminada correctamente.', 'success');
      } catch (error) {
        console.error('Error al eliminar chat:', error);
        this.deletingChatId = null;
        this.showToastMessage('Error al eliminar la conversación.', 'error');
      }
    }
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