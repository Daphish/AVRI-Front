import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChatComponent } from './chat.component';

import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';

import {
  AuthServiceStub,
  ChatServiceStub,
  DocumentServiceStub,
} from '../../../testing/test-stubs';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ChatService, useClass: ChatServiceStub },
        { provide: DocumentService, useClass: DocumentServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
