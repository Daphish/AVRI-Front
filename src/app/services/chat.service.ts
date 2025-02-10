import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Message } from "../interfaces/chat.interface";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiURLChat = "http://localhost:8080/api/chat";

  private _message: Message = {
    text: '',
    sender: 'system',
  };

  public getAnswer(userMessage: string): void {
    this.http.post<Message>(this.apiURLChat, { text: userMessage }).subscribe({
      next: (response) => {
        console.log(response);
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
}
