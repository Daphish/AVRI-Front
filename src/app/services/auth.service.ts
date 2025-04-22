import { Injectable, inject } from '@angular/core';
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
    field_of_study: ''
  };

  private currentUser$$ = new BehaviorSubject<User>(this.noAccountUser);
  currentUser$ = this.currentUser$$.asObservable();

  private loggedIn$$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn$$.asObservable();

  private chatsSubject$$ = new BehaviorSubject<Chat[]>([]);
  chats$ = this.chatsSubject$$.asObservable();

  async login(username: string, password: string): Promise<boolean> {
    const users = await firstValueFrom(this.userService.getUsers());
    const user = users.find(u => u.email === username && u.password === password);
    if (!user) {
      return false;
    }
    this.currentUser$$.next(user);
    this.loggedIn$$.next(true);
    const allChats = await firstValueFrom(this.chatService.getChats());
    this.chatsSubject$$.next(allChats.filter(c => c.idUser === user.id));
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
