import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Chat, Message, RawMessage }            from '../interfaces/chat.interface';

interface AskResponse {
  code: number;
  data: RawMessage;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http        = inject(HttpClient);
  private BASE        = '/api/chat';

  private sessions$$  = new BehaviorSubject<Chat[]>([]);
  sessions$          = this.sessions$$.asObservable();

  private messages$$  = new BehaviorSubject<Message[]>([]);
  messages$          = this.messages$$.asObservable();

  private idChat$$    = new BehaviorSubject<string>('');
  idChat$            = this.idChat$$.asObservable();

  /** Carga las sesiones del usuario */
  loadSessions(): void {
    this.http.get<Chat[]>(`${this.BASE}/`)
      .subscribe(list => this.sessions$$.next(list));
  }

  /** Crea una nueva sesión (evita 400 al mandar siempre session_name) */
  createSession(name: string = 'Chat sin título'): Observable<Chat> {
    return this.http
      .post<Chat>(`${this.BASE}/`, { session_name: name })
      .pipe(
        tap(sess => {
          this.sessions$$.next([sess, ...this.sessions$$.value]);
          this.idChat$$.next(sess.session_id);
        })
      );
  }

  /** Carga los mensajes y los adapta a nuestro modelo */
  loadMessages(sessionId: number | string): void {
    const sid = sessionId.toString();
    this.http.get<{ data: RawMessage[] }>(`${this.BASE}/${sid}/`)
      .pipe(
        map(res =>
          res.data.map(m => ({
            fromUser: m.from_user,
            // <-- incluimos m.query para las preguntas de usuario
            text:      m.text ?? m.answer ?? m.content ?? m.query ?? ''
          }))
        )
      )
      .subscribe(msgs => this.messages$$.next(msgs));
  }

  /** Envía un mensaje (usuario + respuesta) */
  sendMessage(sessionId: number | string, text: string): void {
    const sid = sessionId.toString();

    // 1) Mostrar el mensaje del usuario localmente
    this.messages$$.next([
      ...this.messages$$.value,
      { fromUser: true, text }
    ]);

    // 2) Llamar al backend y mostrar la respuesta
    this.http
      .post<AskResponse>(`${this.BASE}/${sid}/ask/`, { query: text })
      .pipe(
        map(res => res.data),
        map(m => ({
          fromUser: m.from_user,
          text:      m.text ?? m.answer ?? m.content ?? m.query ?? ''
        }))
      )
      .subscribe(reply => {
        this.messages$$.next([...this.messages$$.value, reply]);
      });
  }

  /** Borra una sesión y limpia estado si estaba activa */
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
