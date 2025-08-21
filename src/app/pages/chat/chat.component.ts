import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { Documents, Message } from '../../interfaces/chat.interface';

import { HttpClient } from '@angular/common/http';
import { EventoEncuestaService } from '../../services/evento-encuesta.service';

/* ---------------- modelo de opción del wizard ---------------- */
interface SelectOption {
  label: string;
  selected: boolean;
}

@Component({
  standalone: true,
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [NgIf, NgFor, NgClass, FormsModule],
})
export class ChatComponent implements OnInit {
  /* ---------- inyección ---------- */
  constructor(
    private chatService: ChatService,
    private docService: DocumentService,
    private router: Router,
    private http: HttpClient, 
    private eventoEncuesta: EventoEncuestaService
  ) {}

  /* ---------- refs DOM ---------- */
  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  /* ---------- estado chat ---------- */
  sessionId = '';
  messages: Message[] = [];
  newText = '';
  isSending = false;
  mostrarEncuesta = false;
  mostrarFormulario = false;

  /* ---------- estado wizard ---------- */
  showWizard = false;
  step = 0; // 0:intro, 1:temas, 2:keywords, 3:documentos
  savingPrefs = false;

  topics: SelectOption[] = [
    'Ingeniería',
    'Ciencias Sociales',
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

  keywords: SelectOption[] = [
    'Minería de datos',
    'Inteligencia Artificial',
    'Derechos Humanos',
    'Energías Renovables',
    'Cambio Climático',
    'Big Data',
    'Robótica',
    'Nanotecnología',
    'Política Pública',
    'Emprendimiento',
    'Salud Pública',
    'Blockchain',
    'Bioinformática',
    'Ciberseguridad',
  ].map((label) => ({ label, selected: false }));

  documents: SelectOption[] = [
    'Guía rápida de investigación cualitativa',
    'Fundamentos de termodinámica aplicada',
    'Introducción a la nanotecnología',
    'Manual de derecho ambiental mexicano',
    'Patrones de diseño de software',
    'Efectos del cambio climático en México',
    'Dinámicas de grupo en organizaciones',
    'Algoritmos de aprendizaje automático',
    'Análisis económico contemporáneo',
    'Estadística para ciencias sociales',
  ].map((label) => ({ label, selected: false }));

  /* ---------------- ciclo de vida ---------------- */
  ngOnInit(): void {
    /* sesión seleccionada */
    this.chatService.idChat$.subscribe((id) => {
      this.sessionId = id;
      this.messages = [];
      if (this.chatService.pendingWizard) {
        this.chatService.pendingWizard = false;
        this.resetWizard();
        this.showWizard = true;
      }
    });

    /* stream de mensajes */
    this.chatService.messages$.subscribe((msgs) => {
      this.messages = msgs;
      if (msgs.length > 0) this.showWizard = false;
      setTimeout(() => this.scrollBottom(), 0);
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

  /* ================= chat ================= */
  async send(): Promise<void> {
    const text = this.newText.trim();
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

  /* ================= wizard ================= */
  closeWizard(): void {
    this.showWizard = false;
  }

  toggle(opt: SelectOption): void {
    opt.selected = !opt.selected;
  }

  currentList(): SelectOption[] {
    if (this.step === 1) return this.topics;
    if (this.step === 2) return this.keywords;
    return this.documents; // step 3
  }

  canContinue(): boolean {
    const sel = this.currentList().filter((o) => o.selected).length;
    return this.step === 3 ? sel > 0 : sel >= 5;
  }

  next(): void {
    if (this.step === 0) {
      this.step = 1;
      return;
    }

    if (this.step < 3) {
      if (!this.canContinue()) return;
      this.step++;
      return;
    }

    /* step === 3 -> Guardar preferencias */
    if (!this.canContinue()) return;
    this.finishWizard();
  }

  prev(): void {
    if (this.step > 1) this.step--;
  }

  finishWizard(): void {
    this.savingPrefs = true;

    const interests = [
      ...this.topics.filter((o) => o.selected).map((o) => o.label),
      ...this.keywords.filter((o) => o.selected).map((o) => o.label),
    ];
    const docTitles = this.documents
      .filter((o) => o.selected)
      .map((o) => o.label);

    this.chatService.submitProfile(interests, docTitles).subscribe({
      next: () => {
        this.savingPrefs = false;
        this.showWizard = false;
      },
      error: (err) => {
        console.error(err);
        this.savingPrefs = false;
        alert('No se pudo guardar el perfil.');
      },
    });
  }

  resetWizard(): void {
    [...this.topics, ...this.keywords, ...this.documents].forEach(
      (o) => (o.selected = false)
    );
    this.step = 0;
    this.savingPrefs = false;
  }

  /* ---------------- utilidades ---------------- */
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
