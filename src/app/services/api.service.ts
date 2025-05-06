import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  AuthToken,
  AnonymousAuthToken,
} from '../interfaces/user.interface';
import { ChatSession } from '../interfaces/chat.interface';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ----- Autenticación -----
  login(credentials: AuthToken): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/token/`, credentials);
  }

  loginAnonymous(anonymousId: AnonymousAuthToken): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/token-anonymous/`, anonymousId);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/user/create/`, user);
  }

  createAnonymousUser(): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/user/create-anonymous/`, {});
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/me/`);
  }

  // ----- Chat -----
  getChatSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.apiUrl}/chat/`);
  }

  createChatSession(sessionName: string): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/chat/`, {
      session_name: sessionName,
    });
  }

  getChatSession(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/chat/${sessionId}/`);
  }

  deleteChatSession(sessionId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/chat/${sessionId}/`);
  }

  sendMessage(sessionId: string, message: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/chat/${sessionId}/ask/`, {
      query: message,
    });
  }
}
