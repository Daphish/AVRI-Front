import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  throwError
} from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import {
  Chat,
  Message,
  RawMessage,
  ReferenceChunk
} from '../interfaces/chat.interface';

interface SessionHistory {
  chat_id: string;
  messages: {
    content: string;
    role: 'user' | 'assistant';
    reference?: ReferenceChunk[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private BASE_URL = '/api/chat';

  /** Flag: mostrar cuestionario al volver del perfil */
  pendingWizard = false;

  /* ---------- sesiones ---------- */
  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  readonly idChat$ = this.idChat$$.asObservable();

  /* ---------- mensajes ---------- */
  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  /* ===== Sesiones ===== */
  loadSessions(): void {
    this.http
      .get<Chat[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  createSession(name = 'Chat sin título'): Observable<Chat> {
    return this.http
      .post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap(chat => {
          /* MRU */
          this.sessions$$.next([chat, ...this.sessions$$.value]);
          /* Chat activo */
          this.idChat$$.next(chat.session_id);
          /* Saludo inicial */
          this.messages$$.next([
            { fromUser: false, text: 'Hola. ¿Cómo puedo ayudarte hoy?' }
          ]);
        })
      );
  }

  deleteSession(id: string): void {
    this.http.delete(`${this.BASE_URL}/${id}/`).subscribe(() => {
      this.sessions$$.next(
        this.sessions$$.value.filter(s => s.session_id !== id)
      );
      if (this.idChat$$.value === id) {
        this.idChat$$.next('');
        this.messages$$.next([]);
      }
    });
  }

  clearSessions(): void {
    this.sessions$$.next([]);
  }

  /* ===== Mensajes ===== */
  loadMessages(sessionId: string): void {
    /* MRU re-ordenar */
    const list = this.sessions$$.value;
    const idx = list.findIndex(s => s.session_id === sessionId);
    if (idx !== -1) {
      const sel = list[idx];
      this.sessions$$.next([sel, ...list.slice(0, idx), ...list.slice(idx + 1)]);
    }

    this.idChat$$.next(sessionId);
    this.messages$$.next([]); /* limpia la vista */

    this.http
      .get<any>(`${this.BASE_URL}/${sessionId}/`)
      .pipe(
        /* Compatibilidad V3 / V4 */
        map(res =>
          Array.isArray(res?.data) && res.data[0]?.messages
            ? res.data[0].messages
            : res.messages ?? []
        ),
        map((list: any[]) =>
          list.map(m => {
            const chunks: ReferenceChunk[] = m.reference ?? [];
            const uniqueRefs = chunks.filter(
              (c, i, a) => a.findIndex(x => x.document_id === c.document_id) === i
            );
            return {
              fromUser: m.role === 'user',
              text: (m.content ?? m.answer ?? '')
                .replace(/##\d+\$\$/g, '')
                .trim(),
              references: uniqueRefs
            } as Message;
          })
        )
      )
      .subscribe(msgs => this.messages$$.next(msgs));
  }

  sendMessage(sessionId: string, text: string): void {
    /* burbuja usuario */
    this.messages$$.next([...this.messages$$.value, { fromUser: true, text }]);

    this.http
      .post<{ data: RawMessage }>(`${this.BASE_URL}/${sessionId}/ask/`, {
        query: text
      })
      .pipe(
        map(r => r.data),
        map(raw => {
          const ans = (raw.answer ?? raw.content ?? '')
            .replace(/##\d+\$\$/g, '')
            .trim();
          const chunks: ReferenceChunk[] = raw.reference?.chunks ?? [];
          const unique = chunks.filter(
            (c, i, a) => a.findIndex(x => x.document_id === c.document_id) === i
          );
          return {
            fromUser: false,
            text: ans,
            references: unique
          } as Message;
        })
      )
      .subscribe(reply =>
        this.messages$$.next([...this.messages$$.value, reply])
      );
  }

  /* ===== Preferencias de usuario ===== */
  submitProfile(interests: string[], documentTitles: string[]): Observable<any> {
    const payload = {
      profile: JSON.stringify({
        interests,
        document_titles: documentTitles
      })
    };

    const urlCreate = '/api/recommender/profile/create/';
    const urlUpdate = '/api/recommender/profile/me/'; // ajusta si tu Swagger usa otro

    return this.http.post(urlCreate, payload).pipe(
      /* Si ya existe perfil -> actualizamos */
      catchError(err => {
        if (err.status >= 400 && err.status < 500 || err.status === 500) {
          return this.http.patch(urlUpdate, payload);
        }
        return throwError(() => err);
      })
    );
  }
}
