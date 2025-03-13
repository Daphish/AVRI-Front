import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { Chat } from '../interfaces/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  noAccountUser : User = {
    "id": -1,
    "email": '',
    "password": '',
    "name": '',
    "first_name": '',
    "last_name": '',
    "education_level": '',
    "field_of_study": ''
  }

  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();
  private _currentUser: User = this.noAccountUser;
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  chats$ = this.chatsSubject.asObservable();

  constructor(private userService: UserService, private chatService: ChatService){}

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.userService.getUsers().subscribe((data) => {
        const users = data.users;
        const user = users.find((u: User) => u.email === username && u.password === password);

        if(user) {
          this._currentUser = user;
          this.chatService.getChats().subscribe((chatsData) => {
            const allChats = chatsData.chats;
            const userChats = allChats.filter((c: Chat) => c.idUser === this._currentUser.id);
            this.chatsSubject.next(userChats);
          });
          this.loggedIn.next(true);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  logout() {
    this._currentUser = this.noAccountUser;
    this.loggedIn.next(false);
    this.chatsSubject.next([]);
  }

  getUser() {
    return this._currentUser;
  }
}
