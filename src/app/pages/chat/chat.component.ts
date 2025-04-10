import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../interfaces/chat.interface';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgFor, FormsModule, NgClass, NgIf],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent {
  topicNumber: number = 0;
  keyWordNumber: number = 0;
  paperNumber: number = 0;
  selectedTopics: boolean[] = [];
  selectedKeyWords: boolean[] = [];
  selectedDocs: boolean[] = [];
  messages: Message[] = [];
  idChat: number = 0;
  newMessage: string = '';
  topics: string[] = ['Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura', 'topic'];
  keyWords: string[] = ['Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura', 'keyWord'];
  profilerDocs: string[] = ['Ciencias sociales', 'Medicina', 'Química', 'Computación', 'Biología', 'Arquitectura', 'docName'];
  stars = Array(5).fill(0);
  rating = 0;
  hoverValue = 0;
  isLoggedIn = false;
  profilerCounter = 0;
  noProfilerButtonsSelected = false;

  constructor(private authService: AuthService, private chatService: ChatService) { }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this.chatService.chatMessages$.subscribe(chatMessages => {
      this.messages = chatMessages;
    });

    this.chatService.idChat$.subscribe(id => {
      this.idChat = id;
    });

    this.selectedTopics = new Array(this.topics.length).fill(false);
    this.selectedKeyWords = new Array(this.keyWords.length).fill(false);
    this.selectedDocs = new Array(this.profilerDocs.length).fill(false);
  }

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private cdr = inject(ChangeDetectorRef);

  addMessage() {
    if (this.newMessage.trim() !== '') {
      this.messages.push({
        idChat: this.idChat,
        type: "user",
        text: this.newMessage
      });
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

  increaseProfilerCounter(counter: number) {
    if (counter === 0) {
      this.profilerCounter++;
      this.noProfilerButtonsSelected = false;
    } else if (counter === 1 && this.selectedTopics.includes(true)) {
      this.profilerCounter++;
      this.noProfilerButtonsSelected = false;
    } else if (counter === 2 && this.selectedKeyWords.includes(true)) {
      this.profilerCounter++;
      this.noProfilerButtonsSelected = false;
    } else {
      this.noProfilerButtonsSelected = true;
      setTimeout(() => {
        this.noProfilerButtonsSelected = false;
      }, 5000);
    }
  }

  finishProfiler() {
    if (this.selectedDocs.includes(true)) {
      this.isLoggedIn = true;
    } else {
      this.noProfilerButtonsSelected = true;
      setTimeout(() => {
        this.noProfilerButtonsSelected = false;
      }, 5000);
    }
  }

  addTopicNum() {
    this.topicNumber += 1;
  }

  addKeyWordNum() {
    this.keyWordNumber += 1;
  }

  addProfilerDocNum() {
    this.paperNumber += 1;
  }

  toggleTopic(index: number) {
    if (this.selectedTopics[index]) {
      this.selectedTopics[index] = false;
      this.topicNumber--;
    } else {
      if (this.paperNumber < 5) {
        this.selectedTopics[index] = true;
        this.topicNumber++;
      }
    }
  }

  toggleKeyWord(index: number) {
    if (this.selectedKeyWords[index]) {
      this.selectedKeyWords[index] = false;
      this.keyWordNumber--;
    } else {
      if (this.paperNumber < 5) {
        this.selectedKeyWords[index] = true;
        this.keyWordNumber++;
      }
    }
  }

  toggleProfilerDoc(index: number) {
    if (this.selectedDocs[index]) {
      this.selectedDocs[index] = false;
      this.paperNumber--;
    } else {
      if (this.paperNumber < 5) {
        this.selectedDocs[index] = true;
        this.paperNumber++;
      }
    }
  }

  hoverRating(value: number) {
    this.hoverValue = value;
  }

  resetHover() {
    this.hoverValue = 0;
  }

  setRating(value: number) {
    this.rating = value;
  }
}
