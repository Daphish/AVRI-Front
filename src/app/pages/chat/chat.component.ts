import {
  Component, OnInit, ViewChild, ElementRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { Message }     from '../../interfaces/chat.interface';

interface SelectOption { label: string; selected: boolean; }

@Component({
  selector   : 'app-chat',
  standalone : true,
  imports    : [FormsModule, NgIf, NgFor, NgClass],
  templateUrl: './chat.component.html',
  styleUrls  : ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  /* --------------------------- chat core --------------------------- */
  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  sessionId = '';
  messages: Message[] = [];
  newText   = '';
  isSending = false;

  /* -------------------- cuestionario (wizard) ---------------------- */
  showWizard = false;       // overlay visible
  step       = 0;           // 0-intro | 1-topics | 2-keywords | 3-docs
  readonly maxSelect = 5;

  topics:    SelectOption[] = [
    'Química','Ciencias sociales','Ingeniería','Derecho','Medicina','Arquitectura',
    'Biología','Filosofía','Matemáticas','Economía','Arte','Computación'
  ].map(l => ({ label: l, selected: false }));

  keywords:  SelectOption[] = [
    'Antropología','Sociología','Historia','Psicología','Cultura','Diversidad',
    'Física','Algoritmos','Ecología','Ética','Innovación','Neurociencia',
    'Energía','Política','Estadística','Globalización'
  ].map(l => ({ label: l, selected: false }));

  documents: SelectOption[] = [
    'Análisis sociológico…','Estudio de los factores…','Participación ciudadana…',
    'El rol de los medios…','Derechos humanos…','Cambio social y…',
    'Impacto tecnológico…','Desarrollo sostenible…','Avances biomédicos…',
    'Ingeniería de materiales…'
  ].map(l => ({ label: l, selected: false }));

  savingPrefs = false;

  constructor(private chat: ChatService) {}

  /* ======================= ciclo de vida ========================= */
  ngOnInit(): void {
    /* ── cambio de sesión ───────────────────────────────────────── */
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      this.messages  = [];

      if (this.chat.pendingWizard) {
        this.chat.pendingWizard = false;   // consume el flag
        this.resetWizard();
        this.showWizard = true;
      }
    });

    /* ── stream de mensajes ─────────────────────────────────────── */
    this.chat.messages$.subscribe(msgs => {
      this.messages = msgs;
      if (msgs.length > 0) this.showWizard = false;   // si ya hay chat, oculta wizard
      setTimeout(() => this.scrollBottom(), 0);
    });
  }

  /* ====================== wizard helpers ======================== */
  currentList(): SelectOption[] {
    return this.step === 1 ? this.topics
         : this.step === 2 ? this.keywords
         : this.documents;
  }

  toggle(opt: SelectOption): void {
    const list = this.currentList();
    if (!opt.selected && list.filter(o => o.selected).length >= this.maxSelect) return;
    opt.selected = !opt.selected;
  }

  canContinue(): boolean {
    return this.step === 0 || this.currentList().some(o => o.selected);
  }

  next(): void {
    if (!this.canContinue()) return;
    if (this.step < 3) { this.step++; }
    else               { this.finishWizard(); }
  }
  prev(): void { if (this.step > 0) this.step--; }
  closeWizard(): void { this.showWizard = false; }

  finishWizard(): void {
    const interests = [
      ...this.topics  .filter(t => t.selected).map(t => t.label),
      ...this.keywords.filter(k => k.selected).map(k => k.label)
    ];
    const docs = this.documents.filter(d => d.selected).map(d => d.label);

    this.savingPrefs = true;
    this.chat.submitProfile(interests, docs).subscribe({
      next : () => { this.savingPrefs = false; this.showWizard = false; },
      error: ()   => { this.savingPrefs = false; this.showWizard = false; }
    });
  }

  resetWizard(): void {
    this.step = 0;
    [...this.topics, ...this.keywords, ...this.documents]
      .forEach(o => o.selected = false);
  }

  /* ======================= chat actions ========================= */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    this.isSending = true;
    this.showWizard = false;

    if (!this.sessionId) {
      await firstValueFrom(this.chat.createSession());
    }
    this.chat.sendMessage(this.sessionId, text);

    this.newText   = '';
    this.isSending = false;
  }

  openDocument(id: string): void {
    console.log('Abrir documento', id);
  }

  /* ====================== utilidades UI ========================= */
  private scrollBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
