// src/app/services/chat.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Chat, Message, ReferenceChunk, RawMessage } from '../interfaces/chat.interface';
import { AuthService } from './auth.service'; // <--- IMPORTANTE

interface SessionHistory {
  chat_id: string;
  messages: Array<{
    content: string;
    role: 'user' | 'assistant';
    reference?: ReferenceChunk[]; // Asumiendo que el backend puede enviar esto
  }>;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // <--- INYECTAR
  private BASE_URL = '/api/chat';

  /** Flag: mostrar cuestionario al volver del perfil */
  public pendingWizard = false; // Hacerla pública para que ProfileComponent la modifique

  // — Sesiones —
  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  // — Mensajes —
  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  readonly idChat$ = this.idChat$$.asObservable();

  /* ===== Sesiones ===== */
  loadSessions(): void {
    this.http.get<Chat[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  createSession(name: string = 'Chat sin título'): Observable<Chat> {
    return this.http.post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap(newSession => {
          this.sessions$$.next([newSession, ...this.sessions$$.value]);
          this.idChat$$.next(newSession.session_id);
          this.messages$$.next([{ fromUser: false, text: 'Hola. ¿Cómo te puedo ayudar hoy?' }]);
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

  clearSessions(): void {
    this.sessions$$.next([]);
    this.idChat$$.next('');
    this.messages$$.next([]);
  }

  /* ===== Mensajes ===== */
  loadMessages(sessionId: string): void {
    const arr = this.sessions$$.value;
    const idx = arr.findIndex(s => s.session_id === sessionId);
    if (idx !== -1) {
      const sel = arr[idx];
      this.sessions$$.next([sel, ...arr.slice(0, idx), ...arr.slice(idx + 1)]);
    }

    this.idChat$$.next(sessionId);
    this.messages$$.next([]); // Limpia mensajes anteriores antes de cargar nuevos

    this.http.get<any>(`${this.BASE_URL}/${sessionId}/`) // Podría ser SessionHistory o una estructura más genérica si la API varía
      .pipe(
        map(res => {
          // Adaptar según la estructura real de la respuesta del historial
          const rawMessages = Array.isArray(res?.data) && res.data[0]?.messages
            ? res.data[0].messages // Formato esperado con { data: [SessionHistory] }
            : res.messages ?? [];  // Formato alternativo directo con { messages: [] }
          return rawMessages;
        }),
        map((list: any[]) =>
          list.map(m => {
            const chunks: ReferenceChunk[] = m.reference?.chunks ?? m.reference ?? []; // Adaptar si 'reference' puede ser array directamente
            const uniqueRefs = chunks.filter(
              (c, i, a) => a.findIndex(x => x.document_id === c.document_id) === i
            );
            return {
              fromUser: m.role === 'user',
              text: (m.content ?? m.answer ?? '').replace(/##\d+\$\$/g, '').trim(),
              references: uniqueRefs
            } as Message;
          })
        )
      )
      .subscribe(msgs => this.messages$$.next(msgs));
  }

  sendMessage(sessionId: string, text: string): void {
    this.messages$$.next([...this.messages$$.value, { fromUser: true, text }]);

    this.http.post<{ code?: number; data: RawMessage }>( // code es opcional
      `${this.BASE_URL}/${sessionId}/ask/`, { query: text }
    )
      .pipe(
        map(res => res.data),
        map(raw => {
          const ans = (raw.answer ?? raw.content ?? '').replace(/##\d+\$\$/g, '').trim();
          const chunks: ReferenceChunk[] = raw.reference?.chunks ?? [];
          const uniqueRefs = chunks.filter(
            (c, i, a) => a.findIndex(x => x.document_id === c.document_id) === i
          );
          return { fromUser: false, text: ans, references: uniqueRefs } as Message;
        })
      )
      .subscribe(reply => {
        this.messages$$.next([...this.messages$$.value, reply]);
      });
  }

  /* ===== Preferencias de usuario ===== */
  submitProfile(interests: string[], documentTitles: string[]): Observable<any> {
    const payload = {
      profile: JSON.stringify({ // El backend espera un string JSON para 'profile'
        interests,
        document_titles: documentTitles
      })
    };

    const urlCreate = '/api/recommender/profile/create/';
    const urlUpdate = '/api/recommender/profile/me/';

    return this.http.post(urlCreate, payload).pipe(
      tap(() => {
        this.authService.markProfileAsCompleted(true); // Marcar como completado
      }),
      catchError(err => {
        if (err.status === 409 || (err.status >= 400 && err.status < 500)) { // 409 Conflict (ya existe), u otro error de cliente
          return this.http.patch(urlUpdate, payload).pipe(
            tap(() => {
              this.authService.markProfileAsCompleted(true); // Marcar como completado
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}