import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private API = '/api';

  /** Devuelve el array de usuarios **/
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API}/user/list`);
  }

  constructor(private http: HttpClient) {}
}
