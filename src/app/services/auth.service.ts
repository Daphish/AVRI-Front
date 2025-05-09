import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AnonymousUser, User } from '../interfaces/user.interface';

interface TokenResponse { token: string; }
interface AnonymousResponse { anonymous_id: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private currentUser$$ = new BehaviorSubject<User | AnonymousUser | null>(null);
  readonly currentUser$ = this.currentUser$$.asObservable();

  private loggedIn$$ = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this.loggedIn$$.asObservable();

  /* private logoutEvent$$ = new BehaviorSubject<void>(undefined);
  readonly logoutEvent$ = this.logoutEvent$$.asObservable();  */

  /** Llamar en bootstrap para reactivar sesión si hay token */
  async autoLogin(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    this.loggedIn$$.next(true);
    try {
      const user = await firstValueFrom(this.http.get<User>('/api/user/me/'));
      this.currentUser$$.next(user);
    } catch (error) {
      console.error('Error al recuperar el usuario', error);
      // Token inválido → limpiar
      this.logout();
    }
  }

  /** Login con usuario registrado */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const resp = await firstValueFrom(
        this.http.post<TokenResponse>('/api/user/token/', { email, password })
      );
      localStorage.setItem('authToken', resp.token);
      this.loggedIn$$.next(true);

      const user = await firstValueFrom(this.http.get<User>('/api/user/me/'));
      this.currentUser$$.next(user);
      return true;
    } catch {
      return false;
    }
  }

  /** Crear usuario anónimo y obtener token */
  async createAnonymous(): Promise<boolean> {
    try {
      const anon = await firstValueFrom(
        this.http.post<AnonymousResponse>('/api/user/create-anonymous/', {})
      );
      const resp = await firstValueFrom(
        this.http.post<TokenResponse>(
          '/api/user/token-anonymous/',
          { anonymous_id: anon.anonymous_id }
        )
      );
      localStorage.setItem('authToken', resp.token);
      this.loggedIn$$.next(true);

      const user = await firstValueFrom(this.http.get<User>('/api/user/me/'));
      this.currentUser$$.next(user);
      return true;
    } catch {
      return false;
    }
  }

  /** Logout: borra token y estado */
  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUser$$.next(null);
    this.loggedIn$$.next(false);
    /* this.logoutEvent$$.next(); */
  }

  /** Recuperar token para el interceptor */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
