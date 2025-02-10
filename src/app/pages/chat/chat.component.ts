import { NgClass, NgFor } from '@angular/common';
import { Component, inject} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../interfaces/chat.interface';
import { ChatService } from '../../services/chat.service';

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

  private chatService = inject(ChatService);

  addMessage() {
    if (this.newMessage.trim() !== '') {
      this.messages.push({ text: this.newMessage, sender: 'user'});
      const messageText = this.newMessage;
      this.newMessage = '';
      
      this.chatService.getAnswer(messageText);
      setTimeout(() => {
        const systemMessage = this.chatService.message;
        if (systemMessage.text) {
          this.messages.push(systemMessage);
        }
      }, 1000);
      /* setTimeout(() => {
        this.messages.push({ text: 'Hola, soy AVRI, ¿en qué puedo ayudarte?', sender: 'system' });
      }, 1000); */
    }
  }
}
