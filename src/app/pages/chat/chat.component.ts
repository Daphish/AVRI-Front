// src/app/pages/chat/chat.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { firstValueFrom }       from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { Message }     from '../../interfaces/chat.interface';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass],
  templateUrl: './chat.component.html',
  styleUrls:   ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  sessionId  = '';
  messages:  Message[] = [];
  newText    = '';
  isSending  = false;

  /* rating */
  stars = Array(5).fill(0);
  rating = 0;
  hoverValue = 0;

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    /* Cambio de sesión -> cargar mensajes */
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      if (id) {
        this.chat.loadMessages(id);
      }
    });

    /* Stream de mensajes -> render y auto-scroll */
    this.chat.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.scrollToBottom();
    });
  }

  /** Envía texto con Enter o clic */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;

    /* si no hay sesión, crear una nueva nombrada */
    if (!this.sessionId) {
      await firstValueFrom(
        this.chat.createSession('Nueva conversación')
      );
    }

    this.chat.sendMessage(this.sessionId, text);
    this.newText   = '';
    this.isSending = false;
  }

  private scrollToBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  /* rating helpers */
  hoverRating(v: number) { this.hoverValue = v; }
  resetHover()           { this.hoverValue = 0; }
  setRating(v: number)   { this.rating = v; }
}
