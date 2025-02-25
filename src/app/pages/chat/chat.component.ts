import { NgClass, NgFor } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../interfaces/chat.interface';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgFor, FormsModule, NgClass],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent {
  messages: Message[] = [];
  newMessage: string = '';
  topics: string[] = [ 'Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura', 'topic'];
  keyWords: string[] = [ 'Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura', 'keyWord'];
  profilerDocs: string[] = [ 'Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura', 'docName'];
  isLoggedIn = false;
  profilerCounter = 0;
  constructor(private authService: AuthService){}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }
  private chatService = inject(ChatService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private cdr = inject(ChangeDetectorRef); 

  addMessage() {
    if (this.newMessage.trim() !== '') {
      this.messages.push({ text: this.newMessage, sender: 'user' });
      const messageText = this.newMessage;
      this.newMessage = '';
      this.cdr.detectChanges();
      this.scrollToBottom();

      this.chatService.getAnswer(messageText);

      setTimeout(() => {
        const systemMessage = this.chatService.message;
        if (systemMessage.text) {
          this.messages.push(systemMessage);
        }
        this.cdr.detectChanges();
        this.scrollToBottom();
      }, 1000);
    }
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const container = this.chatContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  increaseProfilerCounter() {
    this.profilerCounter++;
    console.log(this.profilerCounter);
  }

  finishProfiler() {
    this.isLoggedIn = true;
  }
}
