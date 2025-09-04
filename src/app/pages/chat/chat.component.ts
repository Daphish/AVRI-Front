import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { Documents, Message } from '../../interfaces/chat.interface';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

/** Único tipo para las listas del wizard */
interface SelectItem {
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLDivElement>;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

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

  constructor(
    public chatService: ChatService,
    private docService: DocumentService,
    private router: Router,
    private http: HttpClient,
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

  /* ---------- método para mostrar toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
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
        await firstValueFrom(
          this.http.put('/api/recommender/profile/me/', payload)
        );
      } catch {
        await firstValueFrom(
          this.http.post('/api/recommender/profile/create/', payload)
        );
      }
      this.auth.markProfileAsCompleted(true);
      this.showWizard = false;
      this.showToastMessage('Preferencias guardadas correctamente', 'success');
    } catch (e) {
      console.error(e);
       this.showToastMessage('Hubo un error al enviar las respuestas. Inténtalo de nuevo.');
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

  try { // ← AGREGAR TRY-CATCH
    if (!this.sessionId) {
      await firstValueFrom(this.chatService.createSession(text));
    }
    this.chatService.sendMessage(this.sessionId, text);
    
    this.newText = '';
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    // manejo de errores
    this.showToastMessage('Hubo un error al enviar el mensaje. Inténtalo de nuevo.');
  } finally {
    this.isSending = false;
  }
}

  openDocument(document: Documents): void {
  try { 
    this.docService.setCurrentDocument(document);
    this.router.navigate(['/document']);
  } catch (error) {
    console.error('Error abriendo documento:', error);
    // manejo de errores
    this.showToastMessage('No se pudo abrir el documento. Inténtalo de nuevo.');
  }
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
