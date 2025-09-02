import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { Documents, Message } from '../../interfaces/chat.interface';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventoEncuestaService } from '../../services/evento-encuesta.service';
import { AuthService } from '../../services/auth.service';

/** Único tipo para las listas del wizard */
interface SelectItem {
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLDivElement>;

  /* ---------- estado chat ---------- */
  sessionId = '';
  messages: Message[] = [];
  newText = '';
  isSending = false;

  /* ---------- wizard (profiler) ---------- */
  showWizard = false;
  step = 0;
  savingPrefs = false;

  temas: SelectItem[] = [
    'Ingeniería',
    'Ciencias Sociales',
    'Ciencias Naturales',
    'Humanidades',
    'Arquitectura',
    'Administración',
    'Psicología',
    'Comunicación',
    'Lenguas',
    'Química',
    'Biología',
    'Derecho',
    'Física',
    'Matemáticas',
    'Medicina',
    'Artes',
    'Economía',
    'Educación',
    'Historia',
  ].map((label) => ({ label, selected: false }));

  keywords: SelectItem[] = [
    'Minería de datos',
    'Inteligencia Artificial',
    'Sistemas Operativos',
    'Algoritmos',
    'Compiladores',
    'Redes',
    'Bases de Datos',
    'Visión por Computador',
    'Aprendizaje Automático',
    'Ciberseguridad',
  ].map((label) => ({ label, selected: false }));

  documentos: SelectItem[] = [
    'Manual de laboratorio',
    'Tesis Doctoral',
    'Artículo de revista',
    'Reporte técnico',
    'Capítulo de libro',
  ].map((label) => ({ label, selected: false }));

  /* ---------- encuesta de satisfacción ---------- */
  mostrarEncuesta = false;
  mostrarFormulario = false;
  isSubmittingSurvey = false;

  preguntas = [
    { id: 'q1', texto: 'Encontré que el sistema es fácil de usar.' },
    { id: 'q2', texto: 'Me gustaría usar el sistema con frecuencia.' },
    { id: 'q3', texto: 'Las funciones del sistema están bien integradas.' },
    { id: 'q4', texto: 'El sistema es innecesariamente complejo.' },
    { id: 'q5', texto: 'Considero que el sistema es consistente.' },
    {
      id: 'q6',
      texto: 'Creo que la mayoría de la gente aprendería a usarlo rápidamente.',
    },
    { id: 'q7', texto: 'El sistema es muy engorroso.' },
    { id: 'q8', texto: 'Me sentí muy confiado usando el sistema.' },
    { id: 'q9', texto: 'Necesité aprender muchas cosas antes de comenzar.' },
    { id: 'q10', texto: 'En general estoy satisfecho con el sistema.' },
  ];

  opciones = [1, 2, 3, 4, 5].map((v) => ({ valor: v, texto: String(v) }));
  respuestas: any = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    q5: 0,
    q6: 0,
    q7: 0,
    q8: 0,
    q9: 0,
    q10: 0,
    comments: '',
  };

  constructor(
    public chatService: ChatService,
    private docService: DocumentService,
    private router: Router,
    private http: HttpClient,
    private eventoEncuesta: EventoEncuestaService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    // 1) Mostrar el wizard primero para usuarios anónimos o sin perfil completo
    this.auth.profileSetupComplete$.subscribe((isComplete) => {
      this.showWizard = !isComplete;
      if (!isComplete) this.step = 0;
    });

    // 2) Gestión de sesión y wizard pendiente (flujo existente)
    this.chatService.idChat$.subscribe((id) => {
      this.sessionId = id;
      this.messages = [];
      if (this.chatService.pendingWizard) {
        this.showWizard = true;
        this.step = 0;
        this.chatService.pendingWizard = false;
      }
    });

    // 3) Flujo de mensajes
    this.chatService.messages$.subscribe((msgs) => {
      this.messages = msgs;
      setTimeout(() => this.scrollBottom(), 0);
    });

    // 4) Encuesta (disparo desde header u otro sitio)
    this.eventoEncuesta.encuestaActivada$.subscribe(() => {
      this.mostrarEncuesta = true;
      this.mostrarFormulario = false;
      setTimeout(() => this.scrollBottom(), 0);
    });
  }

  /* ---------------- Wizard ---------------- */
  currentList(): SelectItem[] {
    return this.step === 1
      ? this.temas
      : this.step === 2
      ? this.keywords
      : this.documentos;
  }

  toggle(opt: SelectItem) {
    opt.selected = !opt.selected;
  }

  canContinue(): boolean {
    const list = this.currentList();
    const min = this.step === 3 ? 1 : 5; // 5 en pasos 1 y 2; 1 en paso 3
    return list.filter((x) => x.selected).length >= min;
  }

  next() {
    if (this.step < 3 && this.canContinue()) this.step++;
  }

  prev() {
    if (this.step > 1) this.step--;
  }

  async savePreferences() {
    this.savingPrefs = true;
    try {
      const payload = {
        profile: {
          interests: [
            ...this.temas.filter((t) => t.selected).map((t) => t.label),
            ...this.keywords.filter((k) => k.selected).map((k) => k.label),
          ],
          document_titles: this.documentos
            .filter((d) => d.selected)
            .map((d) => d.label),
        },
      };
      try {
        await firstValueFrom(this.http.put('/api/recommender/profile/me/', payload));
      } catch {
        await firstValueFrom(this.http.post('/api/recommender/profile/create/', payload));
      }
      this.auth.markProfileAsCompleted(true);
      this.showWizard = false;

    } catch (e) {
      console.error(e);
    } finally {
      this.savingPrefs = false;
    }
  }

  /* ---------------- Encuesta de satisfacción ---------------- */
  iniciarEncuesta() {
    this.mostrarFormulario = true;
  }

  cancelarEncuesta() {
    this.mostrarEncuesta = false;
  }

  enviarEncuesta() {
    for (let i = 1; i <= 10; i++) {
      if (!this.respuestas['q' + i]) {
        alert('Por favor responde todas las preguntas');
        return;
      }
    }

    const payload = {
      version: 'sus-1.0',
      survey: {
        rating_items: {
          q1: this.respuestas.q1,
          q2: this.respuestas.q2,
          q3: this.respuestas.q3,
          q4: this.respuestas.q4,
          q5: this.respuestas.q5,
          q6: this.respuestas.q6,
          q7: this.respuestas.q7,
          q8: this.respuestas.q8,
          q9: this.respuestas.q9,
          q10: this.respuestas.q10,
        },
        comments: this.respuestas.comments || '',
        meta: {
          session_id: this.sessionId || null,
          feature: 'chat',
          locale: navigator.language || 'es',
          user_type: 'unknown',
        },
      },
    };

    const headers = new HttpHeaders({ 'Idempotency-Key': this.uuid() });
    this.isSubmittingSurvey = true;

    this.http.post('/api/feedback/', payload, { headers }).subscribe({
      next: () => {
        alert('¡Gracias! Encuesta enviada.');
        this.mostrarEncuesta = false;
        this.mostrarFormulario = false;
        this.isSubmittingSurvey = false;
        this.respuestas = {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q9: 0,
          q10: 0,
          comments: '',
        };
      },
      error: (error) => {
        console.error('Error al enviar la encuesta:', error);
        alert('Hubo un error al enviar la encuesta. Inténtalo de nuevo.');
        this.isSubmittingSurvey = false;
      },
    });
  }
  /* ---------------- Chat ---------------- */
  async send() {
    const text = this.newText?.trim();
    if (!text) return;

    this.isSending = true;
    this.showWizard = false;

    if (!this.sessionId) {
      await firstValueFrom(this.chatService.createSession(text));
    }
    this.chatService.sendMessage(this.sessionId, text);

    this.newText = '';
    this.isSending = false;
  }

  openDocument(document: Documents): void {
    this.docService.setCurrentDocument(document);
    this.router.navigate(['/document']);
  }

  /* ---------------- utilidades ---------------- */
  get isTyping(): boolean {
    // si tu interfaz Message no trae isLoading, este getter no se usa en la plantilla
    return this.messages.some((m: any) => m?.isLoading);
  }

  trackByIndex(i: number) {
    return i;
  }

  private scrollBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
