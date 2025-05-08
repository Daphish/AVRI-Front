import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { Message } from '../../interfaces/chat.interface';

interface SelectOption {
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLDivElement>;

  /* ---------- chat ---------- */
  sessionId = '';
  messages: Message[] = [];
  newText = '';
  isSending = false;

  /* ---------- wizard ---------- */
  showWizard = false;
  step = 0;         // 0-intro,1-topics,2-keywords,3-docs
  maxSelect = 5;
  savingPrefs = false;

  topics: SelectOption[] = [
    'Química','Ciencias sociales','Ingeniería','Derecho','Medicina','Arquitectura',
    'Biología','Filosofía','Matemáticas','Economía','Arte','Computación'
  ].map(l => ({ label: l, selected: false }));

  keywords: SelectOption[] = [
    'Antropología','Sociología','Historia','Psicología','Cultura','Diversidad',
    'Física','Algoritmos','Ecología','Ética','Innovación','Neurociencia',
    'Energía','Política','Estadística','Globalización'
  ].map(l => ({ label: l, selected: false }));

  documents: SelectOption[] = [
    'Análisis sociológico y humano','Estudio de los factores ambientales','Participación ciudadana en México',
    'El rol de los medios en la sociedad actual','Derechos humanos en México','Cambio social y estadistico',
    'Impacto tecnológico en nuestra sociedad','Desarrollo sostenible y arquitectonico','Avances biomédicos atuales',
    'Ingeniería de materiales renovables'
  ].map(l => ({ label: l, selected: false }));

  constructor(private chat: ChatService) {}

  /* ---------- ciclo ---------- */
  ngOnInit(): void {
    this.chat.idChat$.subscribe(id => {
      this.sessionId = id;
      this.messages = [];

      if (this.chat.pendingWizard) {
        this.chat.pendingWizard = false;
        this.resetWizard();
        this.showWizard = true;
      }
    });

    this.chat.messages$.subscribe(msgs => {
      this.messages = msgs;
      if (msgs.length > 0) this.showWizard = false;
      setTimeout(() => this.scrollBottom(), 0);
    });
  }

  /* ---------- wizard helpers ---------- */
  currentList(): SelectOption[] {
    if (this.step === 1) return this.topics;
    if (this.step === 2) return this.keywords;
    return this.documents;
  }

  toggle(opt: SelectOption): void {
    const list = this.currentList();
    if (!opt.selected && list.filter(o => o.selected).length >= this.maxSelect)
      return;
    opt.selected = !opt.selected;
  }

  canContinue(): boolean {
    return this.step === 0 || this.currentList().some(o => o.selected);
  }

  next(): void {
    if (!this.canContinue()) return;
    if (this.step < 3) {
      this.step++;
    } else {
      this.finishWizard();
    }
  }

  prev(): void {
    if (this.step > 0) this.step--;
  }

  closeWizard(): void {
    this.showWizard = false;
  }

  /* ---------- nuevo: enviar preferencias ---------- */
  finishWizard(): void {
    const interests = [
      ...this.topics.filter(t => t.selected).map(t => t.label),
      ...this.keywords.filter(k => k.selected).map(k => k.label)
    ];
    const docs = this.documents
      .filter(d => d.selected)
      .map(d => d.label);

    this.savingPrefs = true;
    this.chat
      .submitProfile(interests, docs)
      .subscribe({
        next: () => {
          console.log('Preferencias guardadas');
          this.savingPrefs = false;
          this.showWizard = false;
        },
        error: err => {
          console.error('Error guardando preferencias', err);
          this.savingPrefs = false;
          this.showWizard = false; /* opcional: cierra igual */
        }
      });
  }

  resetWizard(): void {
    this.step = 0;
    [...this.topics, ...this.keywords, ...this.documents].forEach(
      o => (o.selected = false)
    );
  }

  /* ---------- chat send ---------- */
  async send(): Promise<void> {
    const text = this.newText.trim();
    if (!text) return;

    if (!this.sessionId) await firstValueFrom(this.chat.createSession());

    this.showWizard = false;
    this.isSending = true;
    this.chat.sendMessage(this.sessionId, text);

    this.newText = '';
    this.isSending = false;
  }

  openDocument(id: string): void {
    console.log('Abrir documento', id);
  }

  private scrollBottom(): void {
    try {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
