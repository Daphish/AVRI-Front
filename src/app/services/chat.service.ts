// src/app/services/chat.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap }           from 'rxjs/operators';
import { Chat, Message }      from '../interfaces/chat.interface';

interface SessionHistory {
  chat_id: string;
  messages: Array<{
    content:   string;
    role:      'user' | 'assistant';
    reference?: any[];
  }>;
}

interface AskResponse {
  data: {
    content: string;
    role:    'user' | 'assistant';
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http     = inject(HttpClient);
  private BASE_URL = '/api/chat';

  //
  // ——— Sesiones ——————————————————————————————————————————————
  //

  /** Flujo de la lista de sesiones */
  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  /** Obtener todas las sesiones (GET /api/chat/) */
  loadSessions(): void {
    this.http
      .get<Chat[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  /** Crear nueva sesión (POST /api/chat/) */
  createSession(name: string = 'Chat sin título'): Observable<Chat> {
    return this.http
      .post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap(newSession => {
          // Añadir al frente de la lista y activar
          this.sessions$$.next([newSession, ...this.sessions$$.value]);
          this.idChat$$.next(newSession.session_id);
        })
      );
  }

  /** Eliminar sesión (DELETE /api/chat/{id}/) */
  deleteSession(sessionId: string): void {
    this.http
      .delete(`${this.BASE_URL}/${sessionId}/`)
      .subscribe(() => {
        // Quitar de la lista
        const updated = this.sessions$$.value.filter(
          s => s.session_id !== sessionId
        );
        this.sessions$$.next(updated);

        // Si era la sesión activa, limpiar
        if (this.idChat$$.value === sessionId) {
          this.idChat$$.next('');
          this.messages$$.next([]);
        }
      });
  }

  //
  // ——— Mensajes ——————————————————————————————————————————————
  //

  /** Flujo de mensajes para el chat activo */
  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  /** Flujo del sessionId activo */
  private idChat$$ = new BehaviorSubject<string>('');
  readonly idChat$ = this.idChat$$.asObservable();

  /**
   * Carga el historial completo de una sesión:
   * 1) emite el nuevo sessionId
   * 2) llama a GET /api/chat/{sessionId}/
   */
  loadMessages(sessionId: string): void {
    // 1) Cambiar sesión activa
    this.idChat$$.next(sessionId);

    // 2) Recuperar historial del backend
    this.http
      .get<{ data: SessionHistory[] }>(
        `${this.BASE_URL}/${sessionId}/`
      )
      .pipe(
        map(res => {
          // Tomamos data[0].messages
          const hist = res.data[0]?.messages || [];
          return hist.map(m => ({
            fromUser: m.role === 'user',
            text:     m.content.replace(/##\d+\$\$/g, '').trim()
          })) as Message[];
        })
      )
      .subscribe(msgs => {
        this.messages$$.next(msgs);
      });
  }

  /**
   * Envía un mensaje al asistente y añade la respuesta:
   * - Publica el mensaje del usuario inmediatamente
   * - POST /api/chat/{sessionId}/ask/
   * - Añade la respuesta recibida
   */
  sendMessage(sessionId: string, text: string): void {
    // Mostrar mensaje del usuario
    this.messages$$.next([
      ...this.messages$$.value,
      { fromUser: true, text }
    ]);

    // Llamada al backend
    this.http
      .post<AskResponse>(
        `${this.BASE_URL}/${sessionId}/ask/`,
        { query: text }
      )
      .pipe(
        map(res => res.data),
        map(m => ({
          fromUser: m.role === 'user',
          text:     m.content.replace(/##\d+\$\$/g, '').trim()
        }))
      )
      .subscribe(reply => {
        this.messages$$.next([
          ...this.messages$$.value,
          reply
        ]);
      });
  }
}
