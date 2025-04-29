import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  AuthToken,
  AnonymousAuthToken,
  User,
} from '../interfaces/user.interface';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'token';

  constructor(private http: HttpClient) {}

  /** Registra un usuario */
  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/create/`, user);
  }

  /** Login de usuario registrado */
  login(credentials: AuthToken): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/user/token/`, credentials)
      .pipe(
        tap((res) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.tokenKey, res.token);
          }
        })
      );
  }

  /** Login de usuario anónimo */
  loginAnonymous(id: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/user/token-anonymous/`, {
        anonymous_id: id,
      })
      .pipe(
        tap((res) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.tokenKey, res.token);
          }
        })
      );
  }

  createAnonymous(): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/create-anonymous/`, {});
  }

  /** Cierra sesión */
  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  /** ¿Hay token en localStorage? */
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem(this.tokenKey);
    }
    return false;
  }

  /** Cabeceras para interceptor */
  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(this.tokenKey);
    // Cambiado de "Bearer" a "Token"
    return token ? { Authorization: `Token ${token}` } : {};
  }
}

/* import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { Chat } from '../interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userService = inject(UserService);
  private chatService = inject(ChatService);

  private noAccountUser: User = {
    id: -1,
    email: '',
    password: '',
    name: '',
    first_name: '',
    last_name: '',
    education_level: '',
    field_of_study: '',
  };

  private currentUser$$ = new BehaviorSubject<User>(this.noAccountUser);
  currentUser$ = this.currentUser$$.asObservable();

  private loggedIn$$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn$$.asObservable();

  private chatsSubject$$ = new BehaviorSubject<Chat[]>([]);
  chats$ = this.chatsSubject$$.asObservable();

  async login(username: string, password: string): Promise<boolean> {
    const users = await firstValueFrom(this.userService.getUsers());
    const user = users.find(
      (u) => u.email === username && u.password === password
    );
    if (!user) {
      return false;
    }
    this.currentUser$$.next(user);
    this.loggedIn$$.next(true);
    const allChats = await firstValueFrom(this.chatService.getChats());
    this.chatsSubject$$.next(allChats.filter((c) => c.idUser === user.id));
    return true;
  }

  logout(): void {
    this.currentUser$$.next(this.noAccountUser);
    this.loggedIn$$.next(false);
    this.chatsSubject$$.next([]);
    this.chatService.newChat();
  }

  getUser(): User {
    return this.currentUser$$.value;
  }
}
 */
