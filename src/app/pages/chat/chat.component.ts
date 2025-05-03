import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule }           from '@angular/forms';
import { NgFor, NgIf, NgClass }  from '@angular/common';
import { firstValueFrom }        from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { Message }     from '../../interfaces/chat.interface';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  sessionId = '';
  messages: Message[] = [];
  newText   = '';
  isSending = false;

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    // 1) Al cambiar de sesión, limpiar el historial actual
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      this.messages  = [];
    });

    // 2) Al llegar el nuevo historial, reemplazar todo el array
    this.chat.messages$.subscribe(msgs => {
      this.messages = msgs;
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  /** Envía el mensaje del usuario */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;

    // 1) Crear sesión si aún no existe
    if (!this.sessionId) {
      await firstValueFrom(this.chat.createSession());
    }

    // 2) Enviar el texto
    this.chat.sendMessage(this.sessionId, text);

    // 3) Limpiar input y estado
    this.newText   = '';
    this.isSending = false;
  }

  /** Hace scroll al final del contenedor */
  private scrollToBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
