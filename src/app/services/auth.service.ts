import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn$$.asObservable();

  constructor(private http: HttpClient) {}

  async login(email: string, password: string): Promise<boolean> {
    try {
      const params = new HttpParams()
        .set('email', email)
        .set('password', password);
      const resp = await firstValueFrom(
        this.http.post<{ token: string }>(
          '/api/user/token/',
          params.toString(),
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/x-www-form-urlencoded'
            })
          }
        )
      );
      localStorage.setItem('avri_token', resp.token);
      this.loggedIn$$.next(true);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('avri_token');
    this.loggedIn$$.next(false);
  }
}
