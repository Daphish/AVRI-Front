// src/app/services/chat.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject }    from 'rxjs';
import { map, tap }           from 'rxjs/operators';
import { Chat, Message, RawMessage } from '../interfaces/chat.interface';

interface SessionHistory {
  chat_id: string;
  messages: Array<{
    content:   string;
    role:      'user' | 'assistant';
    reference?: any[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http     = inject(HttpClient);
  private BASE_URL = '/api/chat';

  // — Sesiones — 
  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  /** GET /api/chat/ */
  loadSessions(): void {
    this.http
      .get<Chat[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  /** POST /api/chat/ */
  createSession(name: string = 'Chat sin título') {
    return this.http
      .post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap(newSession => {
          this.sessions$$.next([newSession, ...this.sessions$$.value]);
          this.idChat$$.next(newSession.session_id);
        })
      );
  }

  /** DELETE /api/chat/{id}/ */
  deleteSession(sessionId: string): void {
    this.http
      .delete(`${this.BASE_URL}/${sessionId}/`)
      .subscribe(() => {
        const updated = this.sessions$$.value.filter(s => s.session_id !== sessionId);
        this.sessions$$.next(updated);
        if (this.idChat$$.value === sessionId) {
          this.idChat$$.next('');
          this.messages$$.next([]);
        }
      });
  }

  // — Mensajes — 
  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  readonly idChat$ = this.idChat$$.asObservable();

  /**
   * GET /api/chat/{sessionId}/
   * Emite el nuevo sessionId y recupera data[0].messages.
   */
  loadMessages(sessionId: string): void {
    this.idChat$$.next(sessionId);

    this.http
      .get<{ data: SessionHistory[] }>(`${this.BASE_URL}/${sessionId}/`)
      .pipe(
        map(res => {
          const hist = res.data[0]?.messages || [];
          return hist.map(m => ({
            fromUser: m.role === 'user',
            text:     m.content.replace(/##\d+\$\$/g, '').trim()
          })) as Message[];
        })
      )
      .subscribe(msgs => this.messages$$.next(msgs));
  }

  /**
   * POST /api/chat/{sessionId}/ask/
   * Publica el mensaje del usuario inmediatamente
   * y luego añade la respuesta que viene en data.answer.
   */
  sendMessage(sessionId: string, text: string): void {
    // 1) Mostrar el mensaje del usuario
    this.messages$$.next([
      ...this.messages$$.value,
      { fromUser: true, text }
    ]);

    // 2) Llamada al backend
    this.http
      .post<{ code: number; data: RawMessage }>(
        `${this.BASE_URL}/${sessionId}/ask/`,
        { query: text }
      )
      .pipe(
        map(res => res.data),
        map(raw => {
          // extraer answer o fallback content y limpiar tokens ##n$$
          const ans = (raw.answer ?? raw.content ?? '')
            .replace(/##\d+\$\$/g, '')
            .trim();
          return { fromUser: false, text: ans } as Message;
        })
      )
      .subscribe(reply => {
        this.messages$$.next([
          ...this.messages$$.value,
          reply
        ]);
      });
  }
}
