import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, ChatSession, RawChatMessage } from '../../interfaces/chat.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { makeMessage, parseMessage } from '../../utils/message.utils';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  // — Profiler & rating —
  topics = [
    'Ciencias sociales',
    'Medicina',
    'Química',
    'Computación',
    'Biología',
    'Arquitectura',
    'topic',
  ];
  keyWords = [
    'Ciencias sociales',
    'Medicina',
    'Química',
    'Computación',
    'Biología',
    'Arquitectura',
    'keyWord',
  ];
  profilerDocs = ['Doc A', 'Doc B', 'Doc C', 'Doc D', 'Doc E'];
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

  // — Chat state —
  isLoggedIn = false;
  sessionId!: string;
  sessionName = '';
  chats: ChatSession[] = [];
  messages: ChatMessage[] = [];
  messageInput = '';
  loading = false;
  error = '';

  ngOnInit() {
    // Inicializa arrays del profiler
    this.selectedTopics = Array(this.topics.length).fill(false);
    this.selectedKeyWords = Array(this.keyWords.length).fill(false);
    this.selectedDocs = Array(this.profilerDocs.length).fill(false);

    // Estado de login
    this.isLoggedIn = this.authService.isLoggedIn();
    if (!this.isLoggedIn) {
      this.authService.createAnonymous().subscribe(anonymousUser => {
        this.authService.loginAnonymous(anonymousUser.id).subscribe({});
      });
    }

    // Suscribe a mensajes y sesión activa
    this.api.getChatSessions().subscribe(data => {
      this.chats = data;
    });
  }

  addMessage() {
    const text = this.messageInput.trim();
    if (!text) return;
    this.messages.push(makeMessage(text));
    this.scrollToBottom();
    this.api.sendMessage(this.sessionId, text).subscribe((response: RawChatMessage) => {
      this.messages.push(parseMessage(response));
    });
    this.messageInput = '';
    this.scrollToBottom();
  }

  private scrollToBottom() {
    const el = this.chatContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  // — Métodos del profiler —
  toggleTopic(i: number) {
    const sel = this.selectedTopics;
    sel[i]
      ? ((sel[i] = false), this.topicNumber--)
      : ((sel[i] = true), this.topicNumber++);
  }
  toggleKeyWord(i: number) {
    const sel = this.selectedKeyWords;
    sel[i]
      ? ((sel[i] = false), this.keyWordNumber--)
      : ((sel[i] = true), this.keyWordNumber++);
  }
  toggleProfilerDoc(i: number) {
    const sel = this.selectedDocs;
    sel[i]
      ? ((sel[i] = false), this.paperNumber--)
      : ((sel[i] = true), this.paperNumber++);
  }

  increaseProfilerCounter(step: number) {
    if (
      step === 0 ||
      (step === 1 && this.topicNumber > 0) ||
      (step === 2 && this.keyWordNumber > 0)
    ) {
      this.profilerCounter++;
      this.noProfilerButtonsSelected = false;
    } else {
      this.noProfilerButtonsSelected = true;
      setTimeout(() => (this.noProfilerButtonsSelected = false), 5000);
    }
  }

  finishProfiler() {
    if (this.paperNumber > 0) {
      this.isLoggedIn = true;
    } else {
      this.noProfilerButtonsSelected = true;
      setTimeout(() => (this.noProfilerButtonsSelected = false), 5000);
    }
  }

  // — Métodos de rating —
  hoverRating(v: number) {
    this.hoverValue = v;
  }
  resetHover() {
    this.hoverValue = 0;
  }
  setRating(v: number) {
    this.rating = v;
  }
}
