import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { Documents, Message } from '../../interfaces/chat.interface';

import { HttpClient, HttpHeaders } from '@angular/common/http';

/* Unificamos a un solo tipo para el wizard */
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

  /* ---------- wizard ---------- */
  showWizard = false;
  step = 0;
  savingPrefs = false;

  temas: SelectItem[] = [
    'Ingeniería','Ciencias Sociales','Ciencias Naturales','Humanidades','Arquitectura',
    'Administración','Psicología','Comunicación','Lenguas','Química','Biología','Derecho',
    'Física','Matemáticas','Medicina','Artes','Economía','Educación','Historia',
  ].map(label => ({ label, selected: false }));

  keywords: SelectItem[] = [
    'Minería de datos','Inteligencia Artificial','Sistemas Operativos','Algoritmos','Compiladores',
    'Redes','Bases de Datos','Visión por Computador','Aprendizaje Automático','Ciberseguridad',
  ].map(label => ({ label, selected: false }));

  documentos: SelectItem[] = [
    'Manual de laboratorio','Tesis Doctoral','Artículo de revista','Reporte técnico','Capítulo de libro',
  ].map(label => ({ label, selected: false }));

  

  constructor(
    public chatService: ChatService,
    private docService: DocumentService,
    private router: Router,
    private http: HttpClient,
  ) {}

  async ngOnInit(): Promise<void> {
    // Sesión y wizard
    this.chatService.idChat$.subscribe((id) => {
      this.sessionId = id;
      this.messages = [];
      if (this.chatService.pendingWizard) {
        this.showWizard = true;
        this.step = 0;
        this.chatService.pendingWizard = false;
      }
    });

    // Mensajes
    this.chatService.messages$.subscribe((msgs) => {
      this.messages = msgs;
      setTimeout(() => this.scrollBottom(), 0);
    });

  }

  /* ---------------- Wizard (manteniendo el estilo/HTML original) ---------------- */
  currentList(): SelectItem[] {
    return this.step === 1 ? this.temas : this.step === 2 ? this.keywords : this.documentos;
  }

  toggle(opt: SelectItem) {
    opt.selected = !opt.selected;
  }

  canContinue(): boolean {
    const list = this.currentList();
    const min = this.step === 3 ? 1 : 5; // 5 en pasos 1 y 2; 1 en paso 3
    return list.filter(x => x.selected).length >= min;
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
        temas: this.temas.filter(t => t.selected).map(t => t.label),
        keywords: this.keywords.filter(k => k.selected).map(k => k.label),
        documentos: this.documentos.filter(d => d.selected).map(d => d.label),
      };
      // Método local en vez de chatService.saveProfilePrefs (no existe en tu servicio)
      await firstValueFrom(this.http.post('/api/recommender/profile/create/', payload));
      this.showWizard = false;
    } catch (e) {
      console.error(e);
    } finally {
      this.savingPrefs = false;
    }
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
    return this.messages.some(m => (m as any).isLoading);
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
