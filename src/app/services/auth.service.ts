// src/app/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { AnonymousUser, User } from '../interfaces/user.interface';
import { isPlatformBrowser } from '@angular/common';

interface TokenResponse {
  token: string;
}
interface AnonymousResponse {
  anonymous_id: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private currentUserSource = new BehaviorSubject<User | AnonymousUser | null>(
    null
  );
  readonly currentUser$: Observable<User | AnonymousUser | null> =
    this.currentUserSource.asObservable();

  private loggedInSource = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$: Observable<boolean> =
    this.loggedInSource.asObservable();

  private profileSetupCompleteSource = new BehaviorSubject<boolean>(false);
  readonly profileSetupComplete$: Observable<boolean> =
    this.profileSetupCompleteSource.asObservable();

  constructor() {
    // autoLogin se llama desde AppComponent para controlar el inicio
  }

  // Getter público para el valor actual si es estrictamente necesario (usar con precaución)
  public getCurrentUserSnapshot(): User | AnonymousUser | null {
    return this.currentUserSource.getValue();
  }

  async autoLogin(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return; // No hacer nada si no estamos en el navegador
    }
    const token = localStorage.getItem('authToken');
    console.log(token);
    if (!token) {
      this.logout(); // Limpia todos los estados si no hay token
      return;
    }
    // Si hay token, fetchAndSetCurrentUser determinará el estado de login y usuario.
    await this.fetchAndSetCurrentUser();
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const resp = await firstValueFrom(
        this.http.post<TokenResponse>('/api/user/token/', { email, password })
      );
      localStorage.setItem('authToken', resp.token);
      await this.fetchAndSetCurrentUser();
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      this.logout();
      return false;
    }
  }

  async createAnonymous(): Promise<boolean> {
    try {
      const anonData = await firstValueFrom(
        this.http.post<AnonymousResponse>('/api/user/create-anonymous/', {})
      );
      const resp = await firstValueFrom(
        this.http.post<TokenResponse>('/api/user/token-anonymous/', {
          anonymous_id: anonData.anonymous_id,
        })
      );
      localStorage.setItem('authToken', resp.token);
      await this.fetchAndSetCurrentUser(); // Esto establecerá el usuario anónimo
      return true;
    } catch (error) {
      console.error('Error creando usuario anónimo:', error);
      this.logout();
      return false;
    }
  }

  async fetchAndSetCurrentUser(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.logout();
      return;
    }
    try {
      const user = await firstValueFrom(
        this.http.get<User | AnonymousUser>('/api/user/me/')
      );
      this.loggedInSource.next(true);
      this.currentUserSource.next(user);

      if (user && 'anonymous_id' in user) {
        this.profileSetupCompleteSource.next(true); // Para anónimos, se considera completo o no aplica
      } else if (user) {
        this.profileSetupCompleteSource.next(
          !!(user as User).profile_preferences_set
        );
      } else {
        this.logout(); // Si user es null inesperadamente
      }
    } catch (error) {
      console.error(
        'Error al obtener datos del usuario actual en fetchAndSetCurrentUser:',
        error
      );
      this.logout(); // Si /me/ falla con un token válido, es un problema, hacemos logout
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUserSource.next(null);
    this.loggedInSource.next(false);
    this.profileSetupCompleteSource.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  markProfileAsCompleted(status: boolean = true): void {
    this.profileSetupCompleteSource.next(status);
    const currentUser = this.currentUserSource.value;
    if (currentUser && !('anonymous_id' in currentUser)) {
      const updatedUser = { ...currentUser, profile_preferences_set: status };
      this.currentUserSource.next(updatedUser);
    }
  }
}
