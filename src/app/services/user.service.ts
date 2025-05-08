// src/app/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private url = '/api/user/list';

  /** Devuelve la lista de usuarios */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }
}
