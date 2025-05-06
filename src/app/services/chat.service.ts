// src/app/services/chat.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject, Observable }    from 'rxjs';
import { map, tap }           from 'rxjs/operators';
import { Chat, Message, ReferenceChunk, RawMessage } from '../interfaces/chat.interface';

interface SessionHistory {
  chat_id: string;
  messages: Array<{
    content:   string;
    role:      'user' | 'assistant';
    reference?: ReferenceChunk[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http      = inject(HttpClient);
  private BASE_URL  = '/api/chat';

  // — Sesiones —
  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  /** Obtener sesiones del usuario */
  loadSessions(): void {
    this.http.get<Chat[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  /** Crear nueva sesión y poner saludo inicial */
  createSession(name: string = 'Chat sin título'): Observable<Chat> {
    return this.http.post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap(newSession => {
          // Añadir al frente y activar sesión
          this.sessions$$.next([ newSession, ...this.sessions$$.value ]);
          this.idChat$$.next(newSession.session_id);
          // Mostrar saludo inicial
          this.messages$$.next([
            { fromUser: false, text: 'Hola. ¿Cómo te puedo ayudar hoy?' }
          ]);
        })
      );
  }

  /** Eliminar sesión */
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

  /** Limpia sesiones cargadas (invitado/logout) */
  clearSessions(): void {
    this.sessions$$.next([]);
  }

  // — Mensajes —
  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  private idChat$$    = new BehaviorSubject<string>('');
  readonly idChat$   = this.idChat$$.asObservable();

  loadMessages(sessionId: string): void {
    // MRU reorder
    const arr = this.sessions$$.value;
    const idx = arr.findIndex(s => s.session_id === sessionId);
    if (idx !== -1) {
      const sel = arr[idx];
      this.sessions$$.next([ sel, ...arr.slice(0, idx), ...arr.slice(idx + 1) ]);
    }

    // Emitir sesión activa
    this.idChat$$.next(sessionId);

    // Recuperar historial completo
    this.http.get<{ data: SessionHistory[] }>(`${this.BASE_URL}/${sessionId}/`)
      .pipe(
        map(res => {
          const hist = res.data[0]?.messages || [];
          return hist.map(m => {
            const chunks: ReferenceChunk[] = m.reference ?? [];
            const uniqueRefs = chunks.filter(
              (c, i, a) => a.findIndex(x => x.document_id === c.document_id) === i
            );
            return {
              fromUser:  m.role === 'user',
              text:      m.content.replace(/##\d+\$\$/g, '').trim(),
              references: uniqueRefs
            } as Message;
          });
        })
      )
      .subscribe(msgs => this.messages$$.next(msgs));
  }

  sendMessage(sessionId: string, text: string): void {
    // Mostrar eco local
    this.messages$$.next([ ...this.messages$$.value, { fromUser: true, text } ]);

    // POST /ask/
    this.http.post<{ code: number; data: RawMessage }>(
      `${this.BASE_URL}/${sessionId}/ask/`, { query: text }
    )
    .pipe(
      map(res => res.data),
      map(raw => {
        const ans = (raw.answer ?? raw.content ?? '')
          .replace(/##\d+\$\$/g, '')
          .trim();
        const chunks: ReferenceChunk[] = raw.reference?.chunks ?? [];
        const uniqueRefs = chunks.filter(
          (c, i, a) => a.findIndex(x => x.document_id === c.document_id) === i
        );
        return { fromUser: false, text: ans, references: uniqueRefs } as Message;
      })
    )
    .subscribe(reply => {
      this.messages$$.next([ ...this.messages$$.value, reply ]);
    });
  }
}