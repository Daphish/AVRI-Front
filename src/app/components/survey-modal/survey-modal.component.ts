// survey-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { SurveyEventService } from '../../services/evento-encuesta.service';
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

  /* ---------- method for showing toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  showSurvey = false;
  showForm = false;
  isSubmittingSurvey = false;
  currentSessionId = '';

  questions = [
    { id: 'q1',  text: 'Encontré que el sistema es fácil de usar.' },
    { id: 'q2',  text: 'Me gustaría usar el sistema con frecuencia.' },
    { id: 'q3',  text: 'Las funciones del sistema están bien integradas.' },
    { id: 'q4',  text: 'El sistema es innecesariamente complejo.' },
    { id: 'q5',  text: 'Considero que el sistema es consistente.' },
    { id: 'q6',  text: 'Creo que la mayoría de la gente aprendería a usarlo rápidamente.' },
    { id: 'q7',  text: 'El sistema es muy difícil de usar.' },
    { id: 'q8',  text: 'Me sentí muy confiado usando el sistema.' },
    { id: 'q9',  text: 'Necesité aprender muchas cosas antes de comenzar.' },
    { id: 'q10', text: 'En general estoy satisfecho con el sistema.' },
  ];

  options = [1,2,3,4,5].map(v => ({ value: v, text: String(v) }));

  answers: any = {
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
    q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
    comments: ''
  };

  constructor(
    private surveyEvent: SurveyEventService,
    private chatService: ChatService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    try {
      this.surveyEvent.surveyOn$.subscribe({
        next: () => {
          this.showSurvey = true;
          this.showForm = false;
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

  startSurvey(): void {
    this.showForm = true;
  }

  cancelSurvey(): void {
    this.closeSurvey();
  }

  getBack(): void {
    this.showForm = false;
  }

  closeSurvey(): void {
    this.showSurvey = false;
    this.showForm = false;
    this.resetAnswers();
  }

  sendSurvey(): void {
    for (let i = 1; i <= 10; i++) {
      if (!this.answers['q' + i]) {
        this.showToastMessage('Por favor responde todas las preguntas.', 'warning');
        return;
      }
    }

    const payload = {
      version: 'sus-1.0',
      survey: {
        rating_items: {
          q1: this.answers.q1, q2: this.answers.q2, q3: this.answers.q3, 
          q4: this.answers.q4, q5: this.answers.q5, q6: this.answers.q6, 
          q7: this.answers.q7, q8: this.answers.q8, q9: this.answers.q9, 
          q10: this.answers.q10,
        },
        comments: this.answers.comments || '',
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
        this.closeSurvey();
      },
      error: (error) => {
        console.error('Error al enviar la encuesta:', error);
        this.showToastMessage('Hubo un error al enviar la encuesta. Inténtalo de nuevo.');
        this.isSubmittingSurvey = false;
      }
    });
  }

  private resetAnswers(): void {
    this.answers = {
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
      return Date.now().toString() + Math.random().toString();
    }
  }
}