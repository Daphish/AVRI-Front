import { Component } from '@angular/core';
import { LoginModalComponent } from "../login-modal/login-modal.component";
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
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  isModalOpen = false;
  isLoggedIn = false;
  chats: Chat[] = [];

  constructor(private authService: AuthService, private chatService: ChatService, private router: Router){}

  ngOnInit(){
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this.authService.chats$.subscribe(chats => {
      this.chats = chats;
    });
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  viewHome() {
    this.router.navigate(['home']);
    this.chatService.newChat();
  }

  viewProfile() {
    this.router.navigate(['profile']);
  }

  loadMessages(chatId: number) {
    this.router.navigate(['home']);
    this.chatService.getMessages(chatId);
  }
}
