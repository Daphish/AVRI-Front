import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule }           from '@angular/forms';
import { NgFor, NgIf, NgClass }  from '@angular/common';
import { firstValueFrom }        from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { EventoEncuestaService } from '../../services/evento-encuesta.service';
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
  mostrarEncuesta = false;
  mostrarFormulario = false;


  constructor(private chat: ChatService, private http: HttpClient, private eventoEncuesta: EventoEncuestaService) {}
  
  ngOnInit(): void {
    // Lógica original del chat
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      this.messages  = [];
    });
  
    this.chat.messages$.subscribe(msgs => {
      this.messages = msgs;
      setTimeout(() => this.scrollToBottom(), 0);
    });

     // Escuchar si alguien lanza la encuesta
     this.eventoEncuesta.encuestaActivada$.subscribe(() => {
      this.mostrarEncuesta = true;
      this.mostrarFormulario = false;
      console.log('Encuesta activada desde el header');
    });
    
  }

  iniciarEncuesta() {
    this.mostrarFormulario = true;
  }

  cancelarEncuesta() {
    this.mostrarEncuesta = false;
  }
  

  /** Envía el mensaje del usuario */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;

    // Crear sesión si falta
    if (!this.sessionId) {
      await firstValueFrom(this.chat.createSession());
    }

    // Enviar y dejar que el servicio actualice messages$
    this.chat.sendMessage(this.sessionId, text);

    this.newText   = '';
    this.isSending = false;
  }

  /** Abre el documento de referencia (stub) */
  openDocument(documentId: string): void {
    // TODO: implementar navegación/descarga del documento
    console.log('Abrir documento:', documentId);
  }

  private scrollToBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  preguntas = [
    { texto: '1. I think that I would like to use this system frequently.' },
    { texto: '2. I found the system unnecessarily complex.' },
    { texto: '3. I thought the system was easy to use.' },
    { texto: '4. I think that I would need the support of a technical person to be able to use this system.' },
    { texto: '5. I found the various functions in this system were well integrated.' },
    { texto: '6. I thought there was too much inconsistency in this system.' },
    { texto: '7. I would imagine that most people would learn to use this system very quickly.' },
    { texto: '8. I found the system very awkward to use.' },
    { texto: '9. I felt very confident using the system.' },
    { texto: '10. I needed to learn a lot of things before I could get going with this system.' }
  ];
  
  
  opciones = [
    { valor: 1, texto: '1' },
    { valor: 2, texto: '2' },
    { valor: 3, texto: '3' },
    { valor: 4, texto: '4' },
    { valor: 5, texto: '5' }
  ];
  
  
  respuestas: any = {
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
    q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
    comments: ''
  };  
  
  enviarEncuesta() {
    for (let i = 1; i <= 10; i++) {
      if (!this.respuestas['q' + i]) {
        alert('Por favor responde todas las preguntas');
        return;
      }
    }
  
    const payload = {
      version: "1.0",
      survey: JSON.stringify(this.respuestas)  // <-- aquí está la clave
    };
  
    this.http.post('/api/feedback/', payload).subscribe({
      next: () => {
        alert('Encuesta enviada con éxito');
        this.mostrarEncuesta = false;
        this.mostrarFormulario = false;
      },
      error: (error) => {
        console.error('Error al enviar la encuesta:', error);
        alert('Hubo un error al enviar la encuesta');
      }
    });
  }
  
  
 
}
