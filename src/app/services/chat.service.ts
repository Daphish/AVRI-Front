import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ChatSession, ChatMessage } from '../interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private API = '/api';

  // Subjects internos
  private chats$$    = new BehaviorSubject<ChatSession[]>([]);
  private messages$$ = new BehaviorSubject<ChatMessage[]>([]);
  private idChat$$   = new BehaviorSubject<number>(0);

  // Observables públicos
  chats$    = this.chats$$.asObservable();
  messages$ = this.messages$$.asObservable();
  idChat$   = this.idChat$$.asObservable();

  /**  Devuelve el listado de chats desde el backend */
  getChats(): Observable<ChatSession[]> {
    return this.http
      .get<{ chats: ChatSession[] }>(`${this.API}/chats`)
      .pipe(map(res => res.chats));
  }

  /**  Carga todos los chats en el BehaviorSubject */
  loadChats(): void {
    this.getChats().subscribe(chats => this.chats$$.next(chats));
  }

  /**  Devuelve los mensajes de un chat concreto */
  getMessages(idChat: number): Observable<ChatMessage[]> {
    return this.http
      .get<{ messages: ChatMessage[] }>(`${this.API}/messages?idChat=${idChat}`)
      .pipe(map(res => res.messages));
  }

  /**  Carga mensajes y actualiza idChat$$ */
  loadMessages(idChat: number): void {
    this.getMessages(idChat).subscribe(msgs => {
      this.idChat$$.next(idChat);
      this.messages$$.next(msgs);
    });
  }

  /**  Envía un mensaje de usuario y concatena la respuesta system */
  sendMessage(idChat: number, text: string): void {
    this.http
      .post<ChatMessage>(`${this.API}/chat`, { idChat, text })
      .subscribe(reply => {
        const updated = [...this.messages$$.value, reply];
        this.messages$$.next(updated);
      });
  }

  /**  Inicia un nuevo chat (limpia estado) */
  newChat(): void {
    this.idChat$$.next(0);
    this.messages$$.next([]);
  }
}
