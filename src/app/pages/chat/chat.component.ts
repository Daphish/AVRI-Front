import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { Message } from '../../interfaces/chat.interface';

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
    private router: Router
  ) {}

  /* ---------- refs DOM ---------- */
  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  /* ---------- estado chat ---------- */
  sessionId = '';
  messages: Message[] = [];
  newText = '';
  isSending = false;

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
  }

  /* ================= chat ================= */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;
    this.showWizard = false;

    if (!this.sessionId) {
      await firstValueFrom(this.chatService.createSession());
    }
    this.chatService.sendMessage(this.sessionId, text);

    this.newText = '';
    this.isSending = false;
  }

  openDocument(id: string): void {
    this.docService.setCurrentDocumentId(id);
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
