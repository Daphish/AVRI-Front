// src/app/components/sidebar/sidebar.component.ts

import { Component, OnInit } from '@angular/core';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Chat } from '../../interfaces/chat.interface';
import { ChatService } from '../../services/chat.service';

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

        if (loggedIn) {
          // 2) Cargar sesiones solo cuando ya hay un token válido
          this.chatService.loadSessions();

          // 3) Suscribirse al stream de sesiones y actualizar el arreglo
          this.chatService.sessions$
            .subscribe((userChats: Chat[]) => {
              this.chats = userChats;
            });
        } else {
          // Limpiar chats si se desloguea
          this.chats = [];
        }
      });
  }

  /** Al hacer clic en "Home": crea nueva sesión y navega */
  viewHome() {
    this.chatService.createSession();
    this.router.navigate(['/home']);
  }

  /** Al seleccionar un chat del sidebar: cargar mensajes y navegar */
  loadMessages(chatId: number) {
    this.chatService.loadMessages(chatId);
    this.router.navigate(['/home']);
  }

  openModal()   { this.isModalOpen = true; }
  closeModal()  { this.isModalOpen = false; }
  viewProfile() { this.router.navigate(['/profile']); }
}
