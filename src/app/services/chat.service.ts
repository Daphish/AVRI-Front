// src/app/services/chat.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Chat, Message }      from '../interfaces/chat.interface';

interface RawMessage { from_user: boolean; text: string; }
interface AskResponse {
  code: number;
  data: {
    answer: string;
    // …otros campos que puedas necesitar…
  };
}
interface GetMessagesResponse {
  code: number;
  data: {
    data: RawMessage[];
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http      = inject(HttpClient);
  private BASE      = '/api/chat';

  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  sessions$ = this.sessions$$.asObservable();

  private messages$$ = new BehaviorSubject<Message[]>([]);
  messages$ = this.messages$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  idChat$ = this.idChat$$.asObservable();

  /** Carga sesiones */
  loadSessions(): void {
    this.http.get<Chat[]>(`${this.BASE}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  /** Crea sesión vacía */
  createSession(name?: string): Observable<Chat> {
    const payload = { session_name: name ?? 'Chat sin título' };
    return this.http.post<Chat>(`${this.BASE}/`, payload).pipe(
      tap(sess => {
        this.sessions$$.next([sess, ...this.sessions$$.value]);
        this.idChat$$.next(sess.session_id);
      })
    );
  }

  /** Carga mensajes del servidor y los transforma a Message[] */
  loadMessages(sessionId: number | string): void {
    const sid = sessionId.toString();
    this.http
      .get<GetMessagesResponse>(`${this.BASE}/${sid}/`)
      .pipe(
        map(res =>
          res.data.data.map(m => ({
            fromUser: m.from_user,
            text:      m.text
          }))
        )
      )
      .subscribe(msgs => {
        this.messages$$.next(msgs);
      });
  }

  /**
   * Envía mensaje: primero muestra el tuyo, luego la respuesta del servidor
   * que viene bajo response.data.answer
   */
  sendMessage(sessionId: number | string, text: string): void {
    const sid = sessionId.toString();

    // 1) Mostrar inmediatamente el mensaje del usuario
    const userMsg: Message = { fromUser: true, text };
    this.messages$$.next([...this.messages$$.value, userMsg]);

    // 2) Llamar al backend y luego extraer response.data.answer
    this.http
      .post<AskResponse>(`${this.BASE}/${sid}/ask/`, { query: text })
      .pipe(
        map(res => ({ fromUser: false, text: res.data.answer } as Message))
      )
      .subscribe(botMsg => {
        this.messages$$.next([...this.messages$$.value, botMsg]);
      });
  }

  /** Elimina sesión y limpia estado si es necesario */
  deleteSession(sessionId: number | string): void {
    const sid = sessionId.toString();
    this.http.delete(`${this.BASE}/${sid}/`)
      .subscribe(() => {
        this.sessions$$.next(
          this.sessions$$.value.filter(s => s.session_id !== sid)
        );
        if (this.idChat$$.value === sid) {
          this.idChat$$.next('');
          this.messages$$.next([]);
        }
      });
  }
}
