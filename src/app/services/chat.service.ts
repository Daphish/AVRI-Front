// src/app/services/chat.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import {
  Chat,
  Message,
  ReferenceChunk,
  RawMessage,
} from '../interfaces/chat.interface';
import { AuthService } from './auth.service';
import { DocumentService } from './document.service';
import { DocumentDetail } from './document.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private documentService = inject(DocumentService);
  private readonly BASE_URL = '/api/chat';

  /* Flag para volver a mostrar el wizard después de perfil */
  public pendingWizard = false;

  /* --------------- estado reactivo --------------- */
  private sessions$$ = new BehaviorSubject<Chat[]>([]);
  readonly sessions$ = this.sessions$$.asObservable();

  private messages$$ = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messages$$.asObservable();

  private idChat$$ = new BehaviorSubject<string>('');
  readonly idChat$ = this.idChat$$.asObservable();

  /* --------------- sesiones ---------------------- */
  cleanText(text: string): string {
    return text
      .replace(/<think>.*?<\/think>/gs, '') // remove thinking
      .replace(/##\d+\$\$/g, '') // remove cite
      .trim();
  }

  loadSessions(): void {
    this.http
      .get<Chat[]>(`${this.BASE_URL}/`)
      .pipe(
        map((list) =>
          list.map((s) => ({
            ...s,
            session_name: this.cleanText(s.session_name),
          })),
        ),
      )
      .subscribe((list) => this.sessions$$.next(list));
  }

  clearIdChat(): void {
    this.idChat$$.next('');
    this.messages$$.next([]);
  }

  createSession(name = 'Chat sin título'): Observable<Chat> {
    return this.http
      .post<Chat>(`${this.BASE_URL}/`, { session_name: name })
      .pipe(
        tap((s) => {
          s.session_name = this.cleanText(s.session_name); // remove thinking pattern
          this.sessions$$.next([s, ...this.sessions$$.value]);
          this.idChat$$.next(s.session_id);
          this.messages$$.next([]); // sin mensaje automático
        }),
      );
  }

  deleteSession(id: string): void {
    this.http.delete(`${this.BASE_URL}/${id}/`).subscribe({
      next: () => {
        this.sessions$$.next(
          this.sessions$$.value.filter((c) => c.session_id !== id),
        );
        if (this.idChat$$.value === id) {
          this.idChat$$.next('');
          this.messages$$.next([]);
        }
      },
      error: (err) => console.error('Error al borrar sesión:', err),
    });
  }

  /** Utilizado al cerrar sesión / modo invitado: borra todo lo local */
  clearSessions(): void {
    this.sessions$$.next([]);
    this.idChat$$.next('');
    this.messages$$.next([]);
  }

  /* --------------- mensajes ---------------------- */
  loadMessages(id: string): void {
    // Reordenar: seleccionado al principio
    const arr = this.sessions$$.value;
    const idx = arr.findIndex((s) => s.session_id === id);
    if (idx !== -1) {
      const sel = arr[idx];
      this.sessions$$.next([sel, ...arr.slice(0, idx), ...arr.slice(idx + 1)]);
    }

    this.idChat$$.next(id);
    this.messages$$.next([]);

    this.http
      .get<any>(`${this.BASE_URL}/${id}/`)
      .pipe(
        map((res) =>
          Array.isArray(res?.data) && res.data[0]?.messages
            ? res.data[0].messages
            : (res.messages ?? []),
        ),
        map((list: any[]) =>
          list.map((m) => {
            const chunks: ReferenceChunk[] =
              m.reference?.chunks ?? m.reference ?? [];
            const uniqueRefs = chunks.filter(
              (c, i, a) =>
                a.findIndex((x) => x.document_id === c.document_id) === i,
            );
            const documentIds = uniqueRefs.map((r) => r.document_id);
            const detailedDocs: DocumentDetail[] = [];
            this.documentService
              .getDocumentsByIds(documentIds)
              .subscribe((docs) => {
                detailedDocs.push(...docs);
              });
            return {
              fromUser: m.role === 'user',
              text: this.cleanText(m.content ?? m.answer ?? ''),
              references: detailedDocs,
            } as Message;
          }),
        ),
      )
      .subscribe((msgs) => this.messages$$.next(msgs));
  }

  /** Envía texto y agrega burbuja “escribiendo…” */
  sendMessage(sessionId: string, text: string): void {
    const userMsg: Message = { fromUser: true, text };
    const typingMsg: Message = { fromUser: false, text: '', isLoading: true };

    this.messages$$.next([...this.messages$$.value, userMsg, typingMsg]);

    this.http
      .post<{ data: RawMessage }>(`${this.BASE_URL}/${sessionId}/ask/`, {
        query: text,
      })
      .pipe(
        map((r) => r.data),
        map((raw) => {
          const answer = this.cleanText(raw.answer ?? raw.content ?? '');
          const chunks: ReferenceChunk[] = raw.reference?.chunks ?? [];
          const uniqueRefs = chunks.filter(
            (c, i, a) =>
              a.findIndex((x) => x.document_id === c.document_id) === i,
          );
          const documentIds = uniqueRefs.map((r) => r.document_id);
          const detailedDocs: DocumentDetail[] = [];
          this.documentService
            .getDocumentsByIds(documentIds)
            .subscribe((docs) => {
              detailedDocs.push(...docs);
            });
          return {
            fromUser: false,
            text: answer,
            references: detailedDocs,
          } as Message;
        }),
      )
      .subscribe({
        next: (reply) => {
          const msgs = [...this.messages$$.value];
          const idx = msgs.findIndex((m) => m.isLoading);
          if (idx !== -1) msgs[idx] = reply;
          else msgs.push(reply);
          this.messages$$.next(msgs);
        },
        error: (err) => {
          console.error(err);
          this.messages$$.next(
            this.messages$$.value.filter((m) => !m.isLoading),
          );
        },
      });
  }

  /* --------------- preferencias perfil --------------- */
  getProfile(): Observable<any> {
    return this.http.get('/api/recommender/profile/me/');
  }
  submitProfile(
    interests: string[],
    documentTitles: string[],
  ): Observable<any> {
    const payload = {
      profile: {
        interests: interests,
        document_titles: documentTitles,
      },
    };

    const urlCreate = '/api/recommender/profile/create/';
    const urlUpdate = '/api/recommender/profile/me/';

    return this.getProfile().pipe(
      switchMap(() =>
        this.http
          .patch(urlUpdate, payload)
          .pipe(tap(() => this.authService.markProfileAsCompleted(true))),
      ),
      catchError((err) => {
        return this.http.post(urlCreate, payload).pipe(
          tap(() => this.authService.markProfileAsCompleted(false)),
          catchError((error) => throwError(() => error)),
        );
      }),
    );
  }
}
