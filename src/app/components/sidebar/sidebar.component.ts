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
    // 1) Estado de login
    this.authService.isLoggedIn$.subscribe(flag => this.isLoggedIn = flag);
    // 2) Chats del usuario
    this.authService.chats$.subscribe(userChats => this.chats = userChats);
    // 3) Si quieres mostrar TODOS los chats en el sidebar aunque no esté logueado:
    // this.chatService.loadChats();
    // this.chatService.chats$.subscribe(list => this.chats = list);
  }

  viewHome() {
    // Llamado desde (click)="viewHome()"
    this.chatService.newChat();
    this.router.navigate(['/home']);
  }

  loadMessages(chatId: number) {
    // Llamado desde (click)="loadMessages(chat.id)"
    this.chatService.loadMessages(chatId);
    this.router.navigate(['/home']);
  }

  openModal()   { this.isModalOpen = true; }
  closeModal()  { this.isModalOpen = false; }
  viewProfile() { this.router.navigate(['/profile']); }
}
