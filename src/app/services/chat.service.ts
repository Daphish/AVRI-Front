import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Message } from "../interfaces/chat.interface";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiURLChat = "http://localhost:8080/api/chat";
  private messagesUrl = "/data/messages.json";
  private chatsUrl = "/data/chats.json";

  private _message: Message = {
    idChat: 1,
    type: "user",
    text: ""
  };

  private chatMessages = new BehaviorSubject<Message[]>([]);
  chatMessages$ = this.chatMessages.asObservable();
  private idChat = new BehaviorSubject<number>(0);
  idChat$ = this.idChat.asObservable();

  public getAnswer(userMessage: string): void {
    this.http.post<Message>(this.apiURLChat, { text: userMessage }).subscribe({
      next: (response) => {
        response.idChat = 1;
        this._message = response;
      },
      error: (error) => {
        console.log("Error respondiendo mensaje", error);
      }
    });
  }

  public get message(): Message {
    return this._message;
  }

  public getChats(): Observable<any> {
    return this.http.get(this.chatsUrl);
  }

  public getMessages(idChat: number): void {
    this.http.get<any>(this.messagesUrl).subscribe((data) => {
      const allMessages = data.messages;
      const filteredMessages = allMessages.filter((m: Message) => m.idChat === idChat);
      const id = idChat;
      this.chatMessages.next(filteredMessages);
      this.idChat.next(id);
    })
  }

  public newChat(): void {
    this.idChat.next(0);
    this.chatMessages.next([]);
  }
}
