import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { Documents, Message } from '../../interfaces/chat.interface';

import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

/** Only type por wizard lists */
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

  /* ---------- chat state ---------- */
  sessionId = '';
  messages: Message[] = [];
  newText = '';
  isSending = false;

  /* ---------- wizard (profiler) ---------- */
  showWizard = false;
  step = 0;
  savingPrefs = false;

  topics: SelectItem[] = [
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

  documents: SelectItem[] = [
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
    // 1) Show wizard to anonymous users or users with an incomplete profile
    this.auth.profileSetupComplete$.subscribe((isComplete) => {
      this.showWizard = isComplete === false;
      if (!isComplete) this.step = 0;
    });

    // 2) Pending wizard on session
    this.chatService.idChat$.subscribe((id) => {
      this.sessionId = id;
      this.messages = [];
      if (this.chatService.pendingWizard) {
        this.showWizard = true;
        this.step = 0;
        this.chatService.pendingWizard = false;
      }
    });

    // 3) Message flow
    this.chatService.messages$.subscribe((msgs) => {
      this.messages = msgs;
      setTimeout(() => this.scrollBottom(), 0);
    });
  }

  /* ---------------- Wizard ---------------- */
  currentList(): SelectItem[] {
    return this.step === 1
      ? this.topics
      : this.step === 2
      ? this.keywords
      : this.documents;
  }

  toggle(opt: SelectItem) {
    opt.selected = !opt.selected;
  }

  canContinue(): boolean {
    const list = this.currentList();
    const min = this.step === 3 ? 1 : 5;
    return list.filter((x) => x.selected).length >= min;
  }

  next() {
    if (this.step < 3 && this.canContinue()) this.step++;
  }

  prev() {
    if (this.step > 1) this.step--;
  }

  /* ---------- method for showing toast ---------- */
  private showToastMessage(
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) {
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
            ...this.topics.filter((t) => t.selected).map((t) => t.label),
            ...this.keywords.filter((k) => k.selected).map((k) => k.label),
          ],
          document_titles: this.documents
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
      this.showToastMessage(
        'Hubo un error al enviar las respuestas. Inténtalo de nuevo.'
      );
    } finally {
      this.savingPrefs = false;
    }
  }

  /* ---------------- Chat ---------------- */
  async send() {
    const text = this.newText?.trim();
    if (!text) return;

    this.isSending = true;

    try {
      if (!this.sessionId) {
        await firstValueFrom(this.chatService.createSession(text));
      }

      await this.chatService.sendMessage(this.sessionId, text);

      this.newText = '';
      this.showWizard = false;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      this.showToastMessage(
        'Hubo un error al enviar el mensaje. Inténtalo de nuevo.'
      );
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
      this.showToastMessage(
        'No se pudo abrir el documento. Inténtalo de nuevo.'
      );
    }
  }

  /* ---------------- utilities ---------------- */
  get isTyping(): boolean {
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
