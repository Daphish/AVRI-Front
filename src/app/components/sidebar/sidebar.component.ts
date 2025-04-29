// src/app/components/sidebar/sidebar.component.ts

import { Component, OnInit } from '@angular/core';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Chat } from '../../interfaces/chat.interface';
import { ChatService } from '../../services/chat.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LoginModalComponent, NgIf, NgClass, NgFor],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isModalOpen = false;
  isLoggedIn = false;
  chats: Chat[] = [];
  currentUserName = 'Invitado';

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1) Escuchar cambios en el estado de autenticación
    this.authService.isLoggedIn$
      .subscribe((loggedIn: boolean) => {
        this.isLoggedIn = loggedIn;

        // Actualizar nombre
        if (loggedIn) {
          this.authService.currentUser$
            .subscribe(user => {
              this.currentUserName = user?.first_name
                                     ? `${user.first_name}`
                                     : 'Usuario';
            });
        } else {
          this.currentUserName = 'Invitado';
          this.chats = [];
        }

        // Cargar sesiones al loguear
        if (loggedIn) {
          this.chatService.loadSessions();
          this.chatService.sessions$
            .subscribe((userChats: Chat[]) => {
              this.chats = userChats;
            });
        }
      });
  }

  viewHome() {
    this.chatService.createSession();
    this.router.navigate(['/home']);
  }

  loadMessages(chatId: number) {
    this.chatService.loadMessages(chatId);
    this.router.navigate(['/home']);
  }

  openModal()   { this.isModalOpen = true; }
  closeModal()  { this.isModalOpen = false; }
  viewProfile() { this.router.navigate(['/profile']); }
}
