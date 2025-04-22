import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Message } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  isLoggedIn = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Estado de login
    this.authService.isLoggedIn$.subscribe(flag => this.isLoggedIn = flag);

    // Escuchar cambios en idChat
    this.chatService.idChat$.subscribe(id => {
      // cuando cambia la sesión, clear o scroll
      setTimeout(() => this.scrollToBottom(), 0);
    });

    // Escuchar nuevo stream de mensajes
    this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  addMessage(): void {
    const text = this.newMessage.trim();
    if (!text || !this.isLoggedIn) return;

    // Enviar al backend
    this.chatService.sendMessage(text);
    // Limpiar caja
    this.newMessage = '';
  }

  private scrollToBottom(): void {
    const el = this.chatContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
