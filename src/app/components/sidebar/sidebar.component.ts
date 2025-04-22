// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';    // <-- importa NgClass aquí
import { Router } from '@angular/router';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Chat } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,                   // <-- agrégalo
    LoginModalComponent
  ],
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

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(flag => this.isLoggedIn = flag);
    this.chatService.loadChats();
    this.chatService.chats$.subscribe(list => this.chats = list);
  }

  viewHome(): void {
    this.chatService.newChat();
    this.router.navigate(['/home']);
  }

  loadMessages(sessionId: string): void {
    this.chatService.selectChat(sessionId);
    this.router.navigate(['/home']);
  }

  openModal(): void { this.isModalOpen = true; }
  closeModal(): void { this.isModalOpen = false; }
  viewProfile(): void { this.router.navigate(['/profile']); }
}
