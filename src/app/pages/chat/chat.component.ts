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
  newText = '';
  isSending = false;

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    // Cuando cambia la sesión activa, actualizar sessionId y cargar su historial
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      if (id) {
        this.chat.loadMessages(id);
      }
    });

    // Cuando llegan respuestas del sistema, las vamos añadiendo al array local
    this.chat.messages$.subscribe(systemMsgs => {
      systemMsgs.forEach(sysMsg => {
        // Evitar duplicados: solo añadir si no existe ya
        if (!this.messages.some(m => !m.fromUser && m.text === sysMsg.text)) {
          this.messages.push({ text: sysMsg.text, fromUser: false });
        }
      });
      // Hacer scroll al fondo
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  /** Envía texto con Enter o clic */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;

    // 1) Añadir tu propio mensaje al array local
    this.messages.push({ text, fromUser: true });

    // 2) Si no hay sesión, crearla
    if (!this.sessionId) {
      await firstValueFrom(this.chat.createSession());
      // la suscripción a idChat$ establecerá sessionId
    }

    // 3) Enviar al backend
    this.chat.sendMessage(this.sessionId, text);

    // 4) Limpiar input y bandera
    this.newText = '';
    this.isSending = false;
  }

  private scrollToBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
