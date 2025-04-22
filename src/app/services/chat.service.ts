import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Chat, Message } from '../interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  // URLs de tu API (ajusta según tu proxy)
  private chatsUrl    = '/api/chat/';
  private messagesUrl = '/api/chat/';
  private askUrl      = '/api/chat/'; 

  // === Streams reactivos ===
  private chats$$    = new BehaviorSubject<Chat[]>([]);
  readonly chats$    = this.chats$$.asObservable();

  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  private idChat$$   = new BehaviorSubject<string>('');
  readonly idChat$   = this.idChat$$.asObservable();

  // === Métodos públicos ===

  /** Carga todos los chats del usuario */
  loadChats(): void {
    this.http.get<Chat[]>(this.chatsUrl)
      .pipe(map(chats => chats))
      .subscribe(this.chats$$);
  }

  /** Inicia una nueva conversación */
  newChat(): void {
    // Limpiar mensajes e id de chat
    this.messages$$.next([]);
    this.idChat$$.next('');
  }

  /** Selecciona un chat existente y obtiene sus mensajes */
  selectChat(sessionId: string): void {
    this.idChat$$.next(sessionId);
    this.http.get<{ messages: Message[] }>(`${this.messagesUrl}${sessionId}/ask/`)
      .pipe(map(res => res.messages))
      .subscribe(this.messages$$);
  }

  /** Envía un mensaje al chat actual */
  sendMessage(text: string): void {
    const sessionId = this.idChat$$.value;
    this.http.post<Message>(`${this.askUrl}${sessionId}/ask/`, { query: text })
      .subscribe(reply => {
        // Append reply al stream actual de mensajes
        this.messages$$.next([...this.messages$$.value, reply]);
      });
  }
}
