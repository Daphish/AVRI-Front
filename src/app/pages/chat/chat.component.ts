import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule }           from '@angular/forms';
import { NgFor, NgIf, NgClass }  from '@angular/common';
import { firstValueFrom }        from 'rxjs';
import { Router }                from '@angular/router';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
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

  constructor(
    private chat: ChatService,
    private doc: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Limpiar cuando cambia de sesión
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      this.messages  = [];
    });

    // Reemplazar con el historial cargado
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

    // Crear sesión si falta
    if (!this.sessionId) {
      await firstValueFrom(this.chat.createSession(text));
    }

    // Enviar y dejar que el servicio actualice messages$
    this.chat.sendMessage(this.sessionId, text);

    this.newText   = '';
    this.isSending = false;
  }

  /** Abre el documento de referencia (stub) */
  openDocument(documentId: string): void {
    this.doc.setCurrentDocumentId(documentId);
    this.router.navigate(['/document']);
  }

  private scrollToBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
