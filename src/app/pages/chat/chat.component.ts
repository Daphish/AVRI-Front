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
  lastUserText = '';
  isSending = false;

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    // Cuando cambia la sesión activa, cargar historial
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      if (id) {
        this.chat.loadMessages(id);
      }
    });

    // Añadir respuestas del sistema al array local
    this.chat.messages$.subscribe(systemMsgs => {
      systemMsgs.forEach(sysMsg => {
        // 1) Tomamos el texto crudo
        const raw = sysMsg.text || '';
        // 2) Limpiamos todos los patrones ##n$$
        const cleaned = raw.replace(/##\d+\$\$/g, '').trim();
        // 3) Si queda texto válido y no es eco ni duplicado, lo añadimos
        if (
          cleaned &&
          cleaned !== this.lastUserText &&
          !this.messages.some(m => !m.fromUser && m.text === cleaned)
        ) {
          this.messages.push({ text: cleaned, fromUser: false });
        }
      });
      // Mantener scroll al fondo
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  /** Envía el mensaje del usuario */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;
    this.lastUserText = text;

    // 1) Añadir mensaje de usuario
    this.messages.push({ text, fromUser: true });

    // 2) Crear sesión si no existe
    if (!this.sessionId) {
      await firstValueFrom(this.chat.createSession());
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
