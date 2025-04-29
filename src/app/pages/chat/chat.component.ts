import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Message } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  idChat = '';
  isLoggedIn = false;

  // Profiler state (sin cambios)
  topics = ['Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura'];
  keyWords = [...this.topics];
  profilerDocs = ['Doc A', 'Doc B', 'Doc C', 'Doc D'];
  selectedTopics: boolean[] = [];
  selectedKeyWords: boolean[] = [];
  selectedDocs: boolean[] = [];
  topicNumber = 0;
  keyWordNumber = 0;
  paperNumber = 0;
  profilerCounter = 0;
  noProfilerButtonsSelected = false;
  stars = Array(5).fill(0);
  rating = 0;
  hoverValue = 0;

  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  ngOnInit() {
    // Inicializar profiler
    this.selectedTopics   = Array(this.topics.length).fill(false);
    this.selectedKeyWords = Array(this.keyWords.length).fill(false);
    this.selectedDocs     = Array(this.profilerDocs.length).fill(false);

    // Estado de login
    this.authService.isLoggedIn$
      .subscribe((flag: boolean) => this.isLoggedIn = flag);

    // Mensajes
    this.chatService.messages$
      .subscribe((msgs: Message[]) => {
        this.messages = msgs;
        setTimeout(() => this.scrollToBottom(), 0);
      });

    // ID de sesión activa
    this.chatService.idChat$
      .subscribe((id: string) => this.idChat = id);
  }

  addMessage() {
    const text = this.newMessage.trim();
    if (!text || !this.isLoggedIn) return;
    this.chatService.sendMessage(this.idChat, text);
    this.newMessage = '';
  }

  private scrollToBottom() {
    const el = this.chatContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  // — Métodos del profiler —
  toggleTopic(i: number) {
    const sel = this.selectedTopics;
    sel[i] ? (sel[i] = false, this.topicNumber--) : (sel[i] = true, this.topicNumber++);
  }
  toggleKeyWord(i: number) {
    const sel = this.selectedKeyWords;
    sel[i] ? (sel[i] = false, this.keyWordNumber--) : (sel[i] = true, this.keyWordNumber++);
  }
  toggleProfilerDoc(i: number) {
    const sel = this.selectedDocs;
    sel[i] ? (sel[i] = false, this.paperNumber--) : (sel[i] = true, this.paperNumber++);
  }

  increaseProfilerCounter(step: number) {
    if (step === 0 || (step === 1 && this.topicNumber > 0) || (step === 2 && this.keyWordNumber > 0)) {
      this.profilerCounter++;
      this.noProfilerButtonsSelected = false;
    } else {
      this.noProfilerButtonsSelected = true;
      setTimeout(() => (this.noProfilerButtonsSelected = false), 5000);
    }
  }

  finishProfiler() {
    if (this.paperNumber > 0) {
      // Finaliza y marca login
      this.authService.login('dummy', 'dummy');  // o redirige a auth real
    } else {
      this.noProfilerButtonsSelected = true;
      setTimeout(() => (this.noProfilerButtonsSelected = false), 5000);
    }
  }

  // — Métodos de rating —
  hoverRating(v: number) { this.hoverValue = v; }
  resetHover()         { this.hoverValue = 0; }
  setRating(v: number) { this.rating = v; }
}
