// src/app/services/chat.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject }    from 'rxjs';
import { map, tap }           from 'rxjs/operators';
import { Chat, Message, ReferenceChunk, RawMessage } from '../interfaces/chat.interface';

interface SessionHistory {
  chat_id: string;
  messages: Array<{
    content:   string;
    role:      'user' | 'assistant';
    // En el historial, reference es un array de ReferenceChunk
    reference?: ReferenceChunk[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http     = inject(HttpClient);
  private BASE_URL = '/api/chat';

  // ——— Sesiones —————————————————————————————————————————————————

  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  loadSessions(): void {
    this.http.get<Chat[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  createSession(name: string = 'Chat sin título') {
    return this.http.post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap(newSession => {
          this.sessions$$.next([newSession, ...this.sessions$$.value]);
          this.idChat$$.next(newSession.session_id);
        })
      );
  }

  deleteSession(sessionId: string): void {
    this.http.delete(`${this.BASE_URL}/${sessionId}/`)
      .subscribe(() => {
        const updated = this.sessions$$.value.filter(s => s.session_id !== sessionId);
        this.sessions$$.next(updated);
        if (this.idChat$$.value === sessionId) {
          this.idChat$$.next('');
          this.messages$$.next([]);
        }
      });
  }

  // ——— Mensajes —————————————————————————————————————————————————

  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  readonly idChat$ = this.idChat$$.asObservable();

  /**
   * Carga el historial de una sesión:
   * 1) MRU reorder
   * 2) emite sessionId activo
   * 3) GET /api/chat/{sessionId}/ → data[0].messages
   *    filtra referencias duplicadas
   */
  loadMessages(sessionId: string): void {
    // 1) MRU reorder
    const arr = this.sessions$$.value;
    const idx = arr.findIndex(s => s.session_id === sessionId);
    if (idx !== -1) {
      const sel = arr[idx];
      this.sessions$$.next([
        sel,
        ...arr.slice(0, idx),
        ...arr.slice(idx + 1)
      ]);
    }

    // 2) Emitir sesión activa
    this.idChat$$.next(sessionId);

    // 3) Recuperar historial
    this.http
      .get<{ data: SessionHistory[] }>(`${this.BASE_URL}/${sessionId}/`)
      .pipe(
        map(res => {
          const hist = res.data[0]?.messages || [];
          return hist.map(m => {
            // referencias del historial
            const chunks: ReferenceChunk[] = m.reference ?? [];
            const uniqueRefs = chunks.filter(
              (c: ReferenceChunk, i: number, a: ReferenceChunk[]) =>
                a.findIndex(x => x.document_id === c.document_id) === i
            );
            return {
              fromUser: m.role === 'user',
              text:     m.content.replace(/##\d+\$\$/g, '').trim(),
              references: uniqueRefs
            } as Message;
          });
        })
      )
      .subscribe(msgs => this.messages$$.next(msgs));
  }

  /**
   * Envía un mensaje al asistente:
   * - publica el mensaje del usuario inmediatamente
   * - POST /api/chat/{sessionId}/ask/
   * - añade la respuesta con referencias filtradas
   */
  sendMessage(sessionId: string, text: string): void {
    // mostrar eco local
    this.messages$$.next([
      ...this.messages$$.value,
      { fromUser: true, text }
    ]);

    // petición al backend
    this.http
      .post<{ code: number; data: RawMessage }>(
        `${this.BASE_URL}/${sessionId}/ask/`,
        { query: text }
      )
      .pipe(
        map(res => res.data),
        map(raw => {
          const ans = (raw.answer ?? raw.content ?? '')
            .replace(/##\d+\$\$/g, '')
            .trim();

          // referencias de la respuesta
          const chunks: ReferenceChunk[] = raw.reference?.chunks ?? [];
          const uniqueRefs = chunks.filter(
            (c: ReferenceChunk, i: number, a: ReferenceChunk[]) =>
              a.findIndex(x => x.document_id === c.document_id) === i
          );

          return {
            fromUser: false,
            text:     ans,
            references: uniqueRefs
          } as Message;
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
