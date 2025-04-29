import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';
import { Chat, Message } from '../interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private BASE = '/api/chat';

  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  sessions$ = this.sessions$$.asObservable();

  private messages$$ = new BehaviorSubject<Message[]>([]);
  messages$ = this.messages$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  idChat$ = this.idChat$$.asObservable();

  /** Carga todas las sesiones del usuario */
  loadSessions(): void {
    this.http.get<Chat[]>(`${this.BASE}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  /** Crea una nueva sesión */
  createSession(name?: string): void {
    this.http.post<Chat>(`${this.BASE}/`, { session_name: name })
      .subscribe(sess => {
        this.sessions$$.next([sess, ...this.sessions$$.value]);
        this.idChat$$.next(sess.id.toString());
      });
  }

  /** Carga los mensajes de una sesión */
  loadMessages(sessionId: number | string): void {
    const sid = sessionId.toString();
    this.http.get<{ data: Message[] }>(`${this.BASE}/${sid}/`)
      .pipe(map(res => res.data))
      .subscribe(msgs => {
        this.idChat$$.next(sid);
        this.messages$$.next(msgs);
      });
  }

  /** Envía una pregunta y agrega la respuesta al stream */
  sendMessage(sessionId: number | string, text: string): void {
    const sid = sessionId.toString();
    this.http.post<Message>(`${this.BASE}/${sid}/ask/`, { query: text })
      .subscribe(reply => {
        this.idChat$$.next(sid);
        this.messages$$.next([...this.messages$$.value, reply]);
      });
  }

  /** Elimina una sesión y limpia estados si corresponde */
  deleteSession(sessionId: number | string): void {
    const sid = sessionId.toString();
    this.http.delete(`${this.BASE}/${sid}/`)
      .subscribe(() => {
        this.sessions$$.next(
          this.sessions$$.value.filter(s => s.id.toString() !== sid)
        );
        if (this.idChat$$.value === sid) {
          this.idChat$$.next('');
          this.messages$$.next([]);
        }
      });
  }
}
