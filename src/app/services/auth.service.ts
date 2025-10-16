import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { AnonymousUser, User } from '../interfaces/user.interface';
import { isPlatformBrowser } from '@angular/common';

interface TokenResponse {
  token: string;
}

interface UserResponse {
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  education_level: string;
  field_of_study: any | null;
  is_staff: boolean;
  is_author: boolean;
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

  private profileSetupCompleteSource = new BehaviorSubject<boolean | null>(
    null
  );
  readonly profileSetupComplete$: Observable<boolean | null> =
    this.profileSetupCompleteSource.asObservable();

  constructor() {
    // autoLogin called from appComponent
  }

  public getCurrentUserSnapshot(): User | AnonymousUser | null {
    return this.currentUserSource.getValue();
  }

  async autoLogin(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const token = localStorage.getItem('authToken');
    console.log(token);
    if (!token) {
      this.logout(); // Cleans states if no token
      return;
    }
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

  async registerUser(
    name: string,
    first_name: string,
    last_name: string,
    is_author: boolean,
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const resp = await firstValueFrom(
        this.http.post<UserResponse>('/api/user/create/', {
          email,
          password,
          name,
          first_name,
          last_name,
          education_level: 'N',
          is_author,
        })
      );
      return true;
    } catch (error) {
      console.error('Error al registrar:', error);
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
      await this.fetchAndSetCurrentUser();
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
        this.profileSetupCompleteSource.next(false);
      } else if (user) {
        const profile = await firstValueFrom(
          this.http.get<any>(`/api/recommender/profile/me/`)
        );
        profile.profile === null
          ? this.profileSetupCompleteSource.next(false)
          : this.profileSetupCompleteSource.next(true);
      } else {
        this.logout();
      }
    } catch (error) {
      console.error(
        'Error al obtener datos del usuario actual en fetchAndSetCurrentUser:',
        error
      );
      this.logout();
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUserSource.next(null);
    this.loggedInSource.next(false);
    this.profileSetupCompleteSource.next(null);
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
