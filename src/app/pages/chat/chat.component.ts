import { NgClass, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Message = {
  text: string;
  sender: 'user' | 'system';
};

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

  addMessage() {
    if (this.newMessage.trim() !== '') {
      this.messages.push({ text: this.newMessage, sender: 'user'});
      this.newMessage = '';
      setTimeout(() => {
        this.messages.push({ text: 'Hola, soy AVRI, ¿en qué puedo ayudarte?', sender: 'system' });
      }, 1000);
    }
  }
}
