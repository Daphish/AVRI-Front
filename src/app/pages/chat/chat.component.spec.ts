import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ChatComponent } from './chat.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Documents } from '../../interfaces/chat.interface';

// Enhanced service stubs for behavior testing
class EnhancedAuthServiceStub {
  private profileCompleteSubject = new BehaviorSubject<boolean>(false);
  currentUser$ = new BehaviorSubject<any>(null);
  isLoggedIn$ = new BehaviorSubject<boolean>(true);
  profileSetupComplete$ = this.profileCompleteSubject.asObservable();
  
  autoLogin() { return Promise.resolve(true); }
  login() { return Promise.resolve(true); }
  logout() {}
  getToken() { return 'mock-token'; }
  markProfileAsCompleted(status: boolean) {
    this.profileCompleteSubject.next(status);
  }
}

class EnhancedChatServiceStub {
  private idChatSubject = new BehaviorSubject<string>('');
  private messagesSubject = new BehaviorSubject<any[]>([]);
  private sessionsSubject = new BehaviorSubject<any[]>([]);
  
  idChat$ = this.idChatSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  sessions$ = this.sessionsSubject.asObservable();
  pendingWizard = false;
  
  loadSessions() {}
  createSession(name: string = 'Chat sin título') {
    return of({ session_id: 'new-session', session_name: name });
  }
  sendMessage(sessionId: string, text: string) {
    // Simulate adding user message and loading message
    const currentMessages = this.messagesSubject.value;
    const userMsg = { fromUser: true, text };
    const loadingMsg = { fromUser: false, text: '', isLoading: true };
    this.messagesSubject.next([...currentMessages, userMsg, loadingMsg]);
  }
  clearIdChat() {
    this.idChatSubject.next('');
    this.messagesSubject.next([]);
  }
}

class EnhancedDocumentServiceStub {
  document$ = new BehaviorSubject<any | null>(null);
  loadDocument() { return of({}); }
  getDocumentsByIds(ids: string[]) { return of([]); }
  setCurrentDocument(document: Documents) {
    this.document$.next(document);
  }
}

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let authService: EnhancedAuthServiceStub;
  let chatService: EnhancedChatServiceStub;
  let documentService: EnhancedDocumentServiceStub;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideRouter([
          { path: 'document', component: ChatComponent }
        ]),
        { provide: AuthService, useClass: EnhancedAuthServiceStub },
        { provide: ChatService, useClass: EnhancedChatServiceStub },
        { provide: DocumentService, useClass: EnhancedDocumentServiceStub },
        provideHttpClient(withFetch()),
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    chatService = TestBed.inject(ChatService) as any;
    documentService = TestBed.inject(DocumentService) as any;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Wizard Navigation', () => {
    beforeEach(() => {
      component.showWizard = true;
      component.step = 1;
      fixture.detectChanges();
    });

    it('should navigate to next step when canContinue is true', () => {
      // Select 5 topics (minimum required)
      for (let i = 0; i < 5; i++) {
        component.topics[i].selected = true;
      }
      
      component.next();
      expect(component.step).toBe(2);
    });

    it('should not navigate to next step when canContinue is false', () => {
      // Select only 2 topics (less than minimum)
      component.topics[0].selected = true;
      component.topics[1].selected = true;
      
      component.next();
      expect(component.step).toBe(1); // Should stay on step 1
    });

    it('should navigate to previous step', () => {
      component.step = 2;
      component.prev();
      expect(component.step).toBe(1);
    });

    it('should not go below step 1 when going previous', () => {
      component.step = 1;
      component.prev();
      expect(component.step).toBe(1);
    });

    it('should return correct currentList based on step', () => {
      component.step = 1;
      expect(component.currentList()).toBe(component.topics);
      
      component.step = 2;
      expect(component.currentList()).toBe(component.keywords);
      
      component.step = 3;
      expect(component.currentList()).toBe(component.documents);
    });
  });

  describe('Preference Selection', () => {
    it('should toggle selection state', () => {
      const item = component.topics[0];
      const initialState = item.selected;
      
      component.toggle(item);
      expect(item.selected).toBe(!initialState);
      
      component.toggle(item);
      expect(item.selected).toBe(initialState);
    });

    it('should validate minimum selections for steps 1 and 2', () => {
      component.step = 1;
      // Select 4 items (less than minimum of 5)
      for (let i = 0; i < 4; i++) {
        component.topics[i].selected = true;
      }
      expect(component.canContinue()).toBeFalse();
      
      // Select 5th item
      component.topics[4].selected = true;
      expect(component.canContinue()).toBeTrue();
    });

    it('should validate minimum selection for step 3', () => {
      component.step = 3;
      // No selection
      expect(component.canContinue()).toBeFalse();
      
      // Select 1 document type (minimum for step 3)
      component.documents[0].selected = true;
      expect(component.canContinue()).toBeTrue();
    });
  });

  describe('Wizard Completion', () => {
    beforeEach(() => {
      component.showWizard = true;
      component.step = 3;
      // Set up valid selections
      for (let i = 0; i < 5; i++) {
        component.topics[i].selected = true;
        component.keywords[i].selected = true;
      }
      component.documents[0].selected = true;
    });

    it('should save preferences successfully', fakeAsync(() => {
      spyOn(authService, 'markProfileAsCompleted');
      
      component.savePreferences();
      tick(); // Wait for async to start
      
      // First try PUT request
      const putReq = httpMock.expectOne('/api/recommender/profile/me/');
      expect(putReq.request.method).toBe('PUT');
      putReq.flush({}); // Success response
      
      tick(); // Wait for promise resolution
      
      expect(authService.markProfileAsCompleted).toHaveBeenCalledWith(true);
      expect(component.showWizard).toBeFalse();
      expect(component.savingPrefs).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('success');
      
      flush(); // Clear any remaining timers
    }));

    it('should fallback to POST when PUT fails', fakeAsync(() => {
      spyOn(authService, 'markProfileAsCompleted');
      
      component.savePreferences();
      tick(); // Wait for async to start
      
      // First try PUT request (fails)
      const putReq = httpMock.expectOne('/api/recommender/profile/me/');
      putReq.flush({}, { status: 404, statusText: 'Not Found' });
      
      tick(); // Wait for error handler to trigger POST
      
      // Then try POST request (succeeds)
      const postReq = httpMock.expectOne('/api/recommender/profile/create/');
      expect(postReq.request.method).toBe('POST');
      postReq.flush({});
      
      tick(); // Wait for promise resolution
      
      // Even when POST is used, it's still a successful profile completion
      expect(authService.markProfileAsCompleted).toHaveBeenCalledWith(true);
      expect(component.showWizard).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('success');
      
      flush(); // Clear any remaining timers
    }));

    it('should handle save preferences error', fakeAsync(() => {
      component.savePreferences();
      tick(); // Wait for async to start
      
      // PUT fails
      const putReq = httpMock.expectOne('/api/recommender/profile/me/');
      putReq.flush({}, { status: 500, statusText: 'Server Error' });
      
      tick(); // Wait for error handler to trigger POST
      
      // POST also fails
      const postReq = httpMock.expectOne('/api/recommender/profile/create/');
      postReq.flush({}, { status: 500, statusText: 'Server Error' });
      
      tick(); // Wait for error handling
      
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');
      expect(component.savingPrefs).toBeFalse();
      
      flush(); // Clear any remaining timers
    }));
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      component.newText = 'Test message';
      component.sessionId = 'existing-session';
    });

    it('should send message with existing session', fakeAsync(() => {
      spyOn(chatService, 'sendMessage');
      
      component.send();
      tick();
      
      expect(chatService.sendMessage).toHaveBeenCalledWith('existing-session', 'Test message');
      expect(component.newText).toBe('');
      expect(component.showWizard).toBeFalse();
    }));

    it('should create new session when sessionId is empty', fakeAsync(() => {
      component.sessionId = '';
      spyOn(chatService, 'createSession').and.returnValue(of({ session_id: 'new-session', session_name: 'Test message' }));
      spyOn(chatService, 'sendMessage');
      
      component.send();
      tick();
      
      expect(chatService.createSession).toHaveBeenCalledWith('Test message');
      expect(chatService.sendMessage).toHaveBeenCalledWith('', 'Test message');
    }));

    it('should not send empty message', () => {
      component.newText = '   ';
      spyOn(chatService, 'sendMessage');
      
      component.send();
      
      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle send message error', fakeAsync(() => {
      component.sessionId = '';
      spyOn(chatService, 'createSession').and.returnValue(throwError(() => new Error('Network error')));
      
      component.send();
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');
      expect(component.isSending).toBeFalse();
      
      // Flush toast auto-hide timer
      flush();
    }));

    it('should set loading state during send', () => {
      component.send();
      expect(component.isSending).toBeTrue();
    });
  });

  describe('Document Opening', () => {
    it('should navigate to document view', () => {
      const mockDocument: Documents = {
        id: 'doc-1',
        title: 'Test Document',
        author: 'Test Author',
        publication_date: '2023-01-01',
        knowledge_area: 'Test Area',
        license: 'MIT',
        repository_uri: 'http://test.com',
        repository_id: 'repo-1',
        status: 'L',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };
      
      spyOn(router, 'navigate');
      spyOn(documentService, 'setCurrentDocument');
      
      component.openDocument(mockDocument);
      
      expect(documentService.setCurrentDocument).toHaveBeenCalledWith(mockDocument);
      expect(router.navigate).toHaveBeenCalledWith(['/document']);
    });

    it('should handle document opening error', () => {
      const mockDocument: any = null;
      spyOn(documentService, 'setCurrentDocument').and.throwError('Error');
      
      component.openDocument(mockDocument);
      
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');
    });
  });

  describe('Toast Notifications', () => {
    it('should show and auto-hide toast', fakeAsync(() => {
      component['showToastMessage']('Test message', 'success');
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Test message');
      expect(component.toastType).toBe('success');
      
      tick(4000);
      
      expect(component.showToast).toBeFalse();
    }));
  });

  describe('Wizard Display Logic', () => {
    it('should show wizard when profile setup is not complete', () => {
      authService.markProfileAsCompleted(false);
      component.ngOnInit();
      
      expect(component.showWizard).toBeTrue();
      expect(component.step).toBe(0);
    });

    it('should hide wizard when profile setup is complete', () => {
      authService.markProfileAsCompleted(true);
      component.ngOnInit();
      
      expect(component.showWizard).toBeFalse();
    });
  });

  describe('Utility Functions', () => {
    it('should detect typing state', () => {
      component.messages = [
        { fromUser: true, text: 'Hello' },
        { fromUser: false, text: '', isLoading: true }
      ];
      
      expect(component.isTyping).toBeTrue();
      
      component.messages = [
        { fromUser: true, text: 'Hello' },
        { fromUser: false, text: 'Response' }
      ];
      
      expect(component.isTyping).toBeFalse();
    });

    it('should track by index', () => {
      expect(component.trackByIndex(5)).toBe(5);
    });
  });
});
