// survey-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { EventoEncuestaService } from '../../services/evento-encuesta.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-survey-modal',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './survey-modal.component.html',
  styleUrl: './survey-modal.component.css',
})
export class SurveyModalComponent implements OnInit {
  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  /* ---------- método para mostrar toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  mostrarEncuesta = false;
  mostrarFormulario = false;
  isSubmittingSurvey = false;
  currentSessionId = '';

  preguntas = [
    { id: 'q1',  texto: 'Encontré que el sistema es fácil de usar.' },
    { id: 'q2',  texto: 'Me gustaría usar el sistema con frecuencia.' },
    { id: 'q3',  texto: 'Las funciones del sistema están bien integradas.' },
    { id: 'q4',  texto: 'El sistema es innecesariamente complejo.' },
    { id: 'q5',  texto: 'Considero que el sistema es consistente.' },
    { id: 'q6',  texto: 'Creo que la mayoría de la gente aprendería a usarlo rápidamente.' },
    { id: 'q7',  texto: 'El sistema es muy difícil de usar.' },
    { id: 'q8',  texto: 'Me sentí muy confiado usando el sistema.' },
    { id: 'q9',  texto: 'Necesité aprender muchas cosas antes de comenzar.' },
    { id: 'q10', texto: 'En general estoy satisfecho con el sistema.' },
  ];

  opciones = [1,2,3,4,5].map(v => ({ valor: v, texto: String(v) }));

  respuestas: any = {
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
    q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
    comments: ''
  };

  constructor(
    private eventoEncuesta: EventoEncuestaService,
    private chatService: ChatService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    try {
      this.eventoEncuesta.encuestaActivada$.subscribe({
        next: () => {
          this.mostrarEncuesta = true;
          this.mostrarFormulario = false;
        },
        error: (error) => {
          console.error('Error en evento encuesta:', error);
          this.showToastMessage('Error al activar la encuesta.');
        }
      });

      this.chatService.idChat$.subscribe({
        next: (id) => {
          this.currentSessionId = id;
        },
        error: (error) => {
          console.error('Error al obtener session ID:', error);
        }
      });
    } catch (error) {
      console.error('Error al inicializar encuesta:', error);
      this.showToastMessage('Error al inicializar la encuesta.');
    }
  }

  iniciarEncuesta(): void {
    this.mostrarFormulario = true;
  }

  cancelarEncuesta(): void {
    this.cerrarEncuesta();
  }

  volverAtras(): void {
    this.mostrarFormulario = false;
  }

  cerrarEncuesta(): void {
    this.mostrarEncuesta = false;
    this.mostrarFormulario = false;
    this.resetearRespuestas();
  }

  enviarEncuesta(): void {
    // Validar que todas las preguntas estén respondidas
    for (let i = 1; i <= 10; i++) {
      if (!this.respuestas['q' + i]) {
        this.showToastMessage('Por favor responde todas las preguntas.', 'warning');
        return;
      }
    }

    const payload = {
      version: 'sus-1.0',
      survey: {
        rating_items: {
          q1: this.respuestas.q1, q2: this.respuestas.q2, q3: this.respuestas.q3, 
          q4: this.respuestas.q4, q5: this.respuestas.q5, q6: this.respuestas.q6, 
          q7: this.respuestas.q7, q8: this.respuestas.q8, q9: this.respuestas.q9, 
          q10: this.respuestas.q10,
        },
        comments: this.respuestas.comments || '',
        meta: {
          session_id: this.currentSessionId || null,
          feature: 'general',
          locale: navigator.language || 'es',
          user_type: 'unknown'
        }
      }
    };

    const headers = new HttpHeaders({ 'Idempotency-Key': this.generateUUID() });
    this.isSubmittingSurvey = true;

    this.http.post('/api/feedback/', payload, { headers }).subscribe({
      next: () => {
        this.showToastMessage('¡Gracias! Tu encuesta ha sido enviada exitosamente.', 'success');
        this.isSubmittingSurvey = false;
        this.cerrarEncuesta();
      },
      error: (error) => {
        console.error('Error al enviar la encuesta:', error);
        this.showToastMessage('Hubo un error al enviar la encuesta. Inténtalo de nuevo.');
        this.isSubmittingSurvey = false;
      }
    });
  }

  private resetearRespuestas(): void {
    this.respuestas = {
      q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
      q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
      comments: ''
    };
  }

  private generateUUID(): string {
    try {
      if ('randomUUID' in crypto) return (crypto as any).randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    } catch (error) {
      console.error('Error al generar UUID:', error);
      // Fallback simple
      return Date.now().toString() + Math.random().toString();
    }
  }
}