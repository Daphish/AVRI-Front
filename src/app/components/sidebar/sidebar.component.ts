import { Component, OnInit } from '@angular/core';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ChatSession } from '../../interfaces/chat.interface';
import { ChatService } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LoginModalComponent, NgIf, NgClass, NgFor],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  isModalOpen = false;
  isLoggedIn = false;
  chats: ChatSession[] = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.api.getChatSessions().subscribe((chats) => {
        this.chats = chats;
      });
    }
  }

  viewHome() {
    // Llamado desde (click)="viewHome()"
    this.chatService.newChat();
    this.router.navigate(['/home']);
  }

  loadMessages(chatId: string) {
    // Llamado desde (click)="loadMessages(chat.id)"
    // TODO: Guardar el chatSession en el servicio
    this.api.getChatSession(chatId);
    this.router.navigate(['/home']);
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
