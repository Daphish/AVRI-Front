import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ModalService } from '../../services/modal.service';
import { BehaviorSubject } from 'rxjs';

// Enhanced service stubs for behavior testing
class EnhancedAuthServiceStub {
  private currentUserSubject = new BehaviorSubject<any>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  
  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  profileSetupComplete$ = new BehaviorSubject<boolean>(true);
  
  autoLogin() { return Promise.resolve(true); }
  login() { return Promise.resolve(true); }
  logout() {}
  getToken() { return null; }
  getCurrentUserSnapshot() { return this.currentUserSubject.value; }
  
  // Test helper methods
  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
  }
  
  setLoggedIn(status: boolean) {
    this.isLoggedInSubject.next(status);
  }
}

class EnhancedChatServiceStub {
  private sessionsSubject = new BehaviorSubject<any[]>([]);
  sessions$ = this.sessionsSubject.asObservable();
  
  loadSessions() {}
  clearSessions() {
    this.sessionsSubject.next([]);
  }
  loadMessages(id: string) {}
  deleteSession(id: string) {
    const currentSessions = this.sessionsSubject.value;
    const filtered = currentSessions.filter(s => s.session_id !== id);
    this.sessionsSubject.next(filtered);
  }
  clearIdChat() {}
  
  // Test helper methods
  setSessions(sessions: any[]) {
    this.sessionsSubject.next(sessions);
  }
}

class EnhancedModalServiceStub {
  private isModalOpenSubject = new BehaviorSubject<boolean>(false);
  isModalOpen$ = this.isModalOpenSubject.asObservable();
  
  openModal() {
    this.isModalOpenSubject.next(true);
  }
  
  closeModal() {
    this.isModalOpenSubject.next(false);
  }
  
  getModalState() {
    return this.isModalOpenSubject.value;
  }
  
  // Test helper methods
  setModalState(isOpen: boolean) {
    this.isModalOpenSubject.next(isOpen);
  }
}

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: EnhancedAuthServiceStub;
  let chatService: EnhancedChatServiceStub;
  let modalService: EnhancedModalServiceStub;
  let router: Router;

  // Mock window.confirm
  let originalConfirm: typeof window.confirm;

  beforeEach(async () => {
    originalConfirm = window.confirm;
    
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: AuthService, useClass: EnhancedAuthServiceStub },
        { provide: ChatService, useClass: EnhancedChatServiceStub },
        { provide: ModalService, useClass: EnhancedModalServiceStub },
        provideRouter([
          { path: 'home', component: SidebarComponent },
          { path: 'profile', component: SidebarComponent }
        ]),
        provideHttpClient(withFetch()), 
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    chatService = TestBed.inject(ChatService) as any;
    modalService = TestBed.inject(ModalService) as any;
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.activeSessionId).toBeNull();
      expect(component.isModalOpen).toBeFalse();
    });

    it('should call autoLogin on initialization', () => {
      spyOn(authService, 'autoLogin');
      
      component.ngOnInit();
      
      expect(authService.autoLogin).toHaveBeenCalled();
    });

    it('should set up observable streams correctly', (done) => {
      // Test isLoggedIn$ stream
      component.isLoggedIn$.subscribe(isLoggedIn => {
        expect(typeof isLoggedIn).toBe('boolean');
        done();
      });
    });
  });

  describe('Authentication State Management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should load sessions when logged in as regular user', () => {
      const regularUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      authService.setCurrentUser(regularUser);
      spyOn(chatService, 'loadSessions');
      
      authService.setLoggedIn(true);
      
      expect(chatService.loadSessions).toHaveBeenCalled();
      expect(component.isModalOpen).toBeFalse();
    });

    it('should not load sessions for anonymous users even when logged in', () => {
      const anonymousUser = { anonymous_id: 'anon-123' };
      authService.setCurrentUser(anonymousUser);
      spyOn(chatService, 'loadSessions');
      
      authService.setLoggedIn(true);
      
      expect(chatService.loadSessions).not.toHaveBeenCalled();
    });

    it('should clear sessions and open modal when logged out', () => {
      spyOn(chatService, 'clearSessions');
      
      authService.setLoggedIn(false);
      
      expect(chatService.clearSessions).toHaveBeenCalled();
      expect(component.isModalOpen).toBeTrue();
    });
  });

  describe('User Display Logic', () => {
    it('should display correct name for regular users', (done) => {
      const user = { id: 1, email: 'test@example.com', name: 'John Doe' };
      authService.setCurrentUser(user);
      
      component.currentUserName$.subscribe(name => {
        expect(name).toBe('John Doe');
        done();
      });
    });

    it('should display fallback name when user has no name', (done) => {
      const user = { id: 1, email: 'test@example.com' };
      authService.setCurrentUser(user);
      
      component.currentUserName$.subscribe(name => {
        expect(name).toBe('Usuario');
        done();
      });
    });

    it('should display "Invitado" for anonymous users', (done) => {
      const user = { anonymous_id: 'anon-123' };
      authService.setCurrentUser(user);
      
      component.currentUserName$.subscribe(name => {
        expect(name).toBe('Invitado');
        done();
      });
    });

    it('should display "Invitado" when no user', (done) => {
      authService.setCurrentUser(null);
      
      component.currentUserName$.subscribe(name => {
        expect(name).toBe('Invitado');
        done();
      });
    });

    it('should display correct initial for user names', (done) => {
      const user = { id: 1, email: 'test@example.com', name: 'Alice Smith' };
      authService.setCurrentUser(user);
      
      component.currentUserInitial$.subscribe(initial => {
        expect(initial).toBe('A');
        done();
      });
    });

    it('should display "?" initial when no name', (done) => {
      authService.setCurrentUser(null);
      
      component.currentUserInitial$.subscribe(initial => {
        expect(initial).toBe('?');
        done();
      });
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate to home and clear chat when viewHome is called', () => {
      spyOn(router, 'navigate');
      spyOn(chatService, 'clearIdChat');
      
      component.viewHome();
      
      expect(chatService.clearIdChat).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to profile when viewProfile is called', () => {
      spyOn(router, 'navigate');
      
      component.viewProfile();
      
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('Session Management', () => {
    it('should load messages and set active session when loadMessages is called', () => {
      spyOn(chatService, 'loadMessages');
      spyOn(router, 'navigate');
      
      component.loadMessages('session-123');
      
      expect(component.activeSessionId).toBe('session-123');
      expect(chatService.loadMessages).toHaveBeenCalledWith('session-123');
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should delete session when confirmation is accepted', () => {
      window.confirm = jasmine.createSpy().and.returnValue(true);
      spyOn(chatService, 'deleteSession');
      
      component.deleteChat('session-456');
      
      expect(window.confirm).toHaveBeenCalledWith('¿Eliminar esta conversación?');
      expect(chatService.deleteSession).toHaveBeenCalledWith('session-456');
    });

    it('should not delete session when confirmation is rejected', () => {
      window.confirm = jasmine.createSpy().and.returnValue(false);
      spyOn(chatService, 'deleteSession');
      
      component.deleteChat('session-456');
      
      expect(window.confirm).toHaveBeenCalledWith('¿Eliminar esta conversación?');
      expect(chatService.deleteSession).not.toHaveBeenCalled();
    });

    it('should prevent event propagation when deleting chat', () => {
      window.confirm = jasmine.createSpy().and.returnValue(true);
      const mockEvent = { stopPropagation: jasmine.createSpy() };
      
      component.deleteChat('session-789', mockEvent as any);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Modal Management', () => {
    it('should open modal when openModal is called', () => {
      component.isModalOpen = false;
      
      component.openModal();
      
      expect(component.isModalOpen).toBeTrue();
    });

    it('should close modal when closeModal is called', () => {
      component.isModalOpen = true;
      
      component.closeModal();
      
      expect(component.isModalOpen).toBeFalse();
    });
  });

  describe('Subscription Management', () => {
    it('should unsubscribe on destroy', () => {
      const subs = (component as any).subs;
      spyOn(subs, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(subs.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete authentication flow', () => {
      component.ngOnInit();
      
      // Start logged out
      authService.setLoggedIn(false);
      expect(component.isModalOpen).toBeTrue();
      
      // Login as regular user
      const user = { id: 1, email: 'user@test.com', name: 'Test User' };
      authService.setCurrentUser(user);
      spyOn(chatService, 'loadSessions');
      
      authService.setLoggedIn(true);
      
      expect(chatService.loadSessions).toHaveBeenCalled();
      expect(component.isModalOpen).toBeFalse();
    });

    it('should handle session operations correctly', () => {
      const sessions = [
        { session_id: 'session-1', session_name: 'Chat 1' },
        { session_id: 'session-2', session_name: 'Chat 2' }
      ];
      chatService.setSessions(sessions);
      
      // Load a specific session
      spyOn(router, 'navigate');
      component.loadMessages('session-1');
      expect(component.activeSessionId).toBe('session-1');
      
      // Delete a session with confirmation
      window.confirm = jasmine.createSpy().and.returnValue(true);
      component.deleteChat('session-2');
      
      expect(window.confirm).toHaveBeenCalled();
    });

    it('should handle user type changes correctly', (done) => {
      let nameEmissions: string[] = [];
      
      component.currentUserName$.subscribe(name => {
        nameEmissions.push(name);
        
        if (nameEmissions.length === 4) {
          expect(nameEmissions).toEqual(['Invitado', 'Invitado', 'John Doe', 'Invitado']);
          done();
        }
      });
      
      // Initial state (no user)
      authService.setCurrentUser(null);
      
      // Anonymous user
      authService.setCurrentUser({ anonymous_id: 'anon' });
      
      // Regular user
      authService.setCurrentUser({ id: 1, name: 'John Doe' });
      
      // Back to no user
      authService.setCurrentUser(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle deleteChat without event parameter', () => {
      window.confirm = jasmine.createSpy().and.returnValue(true);
      spyOn(chatService, 'deleteSession');
      
      // Should not throw error when event is undefined
      expect(() => component.deleteChat('session-test')).not.toThrow();
      expect(chatService.deleteSession).toHaveBeenCalledWith('session-test');
    });

    it('should handle empty session ID gracefully', () => {
      spyOn(chatService, 'loadMessages');
      spyOn(router, 'navigate');
      
      component.loadMessages('');
      
      expect(component.activeSessionId).toBe('');
      expect(chatService.loadMessages).toHaveBeenCalledWith('');
    });

    it('should handle multiple rapid modal state changes', () => {
      component.openModal();
      expect(component.isModalOpen).toBeTrue();
      
      component.closeModal();
      expect(component.isModalOpen).toBeFalse();
      
      component.openModal();
      expect(component.isModalOpen).toBeTrue();
      
      component.openModal(); // Already open
      expect(component.isModalOpen).toBeTrue();
    });
  });

  describe('Dropdown Functionality', () => {
    beforeEach(() => {
      authService.setCurrentUser({ id: 1, name: 'John Doe' });
      authService.setLoggedIn(true);
      fixture.detectChanges();
    });

    it('should initialize with dropdown closed', () => {
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should toggle dropdown open and closed', () => {
      expect(component.isDropdownOpen).toBeFalse();
      
      component.toggleDropdown();
      expect(component.isDropdownOpen).toBeTrue();
      
      component.toggleDropdown();
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should close dropdown when closeDropdown is called', () => {
      component.isDropdownOpen = true;
      component.closeDropdown();
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should navigate to profile and close dropdown', () => {
      spyOn(router, 'navigate');
      component.isDropdownOpen = true;
      
      component.viewProfile();
      
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should close session and close dropdown', async () => {
      spyOn(chatService, 'clearSessions');
      spyOn(authService, 'logout');
      spyOn(router, 'navigate');
      component.isDropdownOpen = true;
      
      await component.closeSession();
      
      expect(chatService.clearSessions).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should handle closeSession errors gracefully', async () => {
      spyOn(chatService, 'clearSessions').and.throwError('Test error');
      spyOn(console, 'error');
      component.isDropdownOpen = true;
      
      await component.closeSession();
      
      expect(console.error).toHaveBeenCalledWith('Error closing session:', jasmine.any(Error));
      expect(component.isDropdownOpen).toBeFalse();
    });
  });

  describe('Click Outside Behavior', () => {
    beforeEach(() => {
      authService.setCurrentUser({ id: 1, name: 'John Doe' });
      authService.setLoggedIn(true);
      fixture.detectChanges();
    });

    it('should close dropdown when clicking outside', () => {
      component.isDropdownOpen = true;
      
      // Simulate click outside dropdown container
      const mockEvent = {
        target: document.createElement('div')
      } as any;
      
      component.onDocumentClick(mockEvent);
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should not close dropdown when clicking inside dropdown container', () => {
      component.isDropdownOpen = true;
      
      // Create a mock element that is inside dropdown container
      const dropdownContainer = document.createElement('div');
      dropdownContainer.className = 'account-dropdown-container';
      const innerElement = document.createElement('div');
      dropdownContainer.appendChild(innerElement);
      
      // Mock closest method to return the container
      spyOn(innerElement, 'closest').and.returnValue(dropdownContainer);
      
      const mockEvent = {
        target: innerElement
      } as any;
      
      component.onDocumentClick(mockEvent);
      expect(component.isDropdownOpen).toBeTrue();
    });

    it('should not close dropdown when dropdown is already closed', () => {
      component.isDropdownOpen = false;
      
      const mockEvent = {
        target: document.createElement('div')
      } as any;
      
      component.onDocumentClick(mockEvent);
      expect(component.isDropdownOpen).toBeFalse();
    });
  });

  describe('Modal Integration', () => {
    it('should update modal state when opening modal', () => {
      spyOn(modalService, 'openModal');
      
      component.openModal();
      
      expect(modalService.openModal).toHaveBeenCalled();
    });

    it('should update modal state when closing modal', () => {
      spyOn(modalService, 'closeModal');
      
      component.closeModal();
      
      expect(modalService.closeModal).toHaveBeenCalled();
    });

    it('should handle modal state changes in ngOnInit', () => {
      spyOn(modalService, 'openModal');
      spyOn(modalService, 'closeModal');
      
      // Simulate user login
      authService.setCurrentUser({ id: 1, name: 'John Doe' });
      authService.setLoggedIn(true);
      
      // Trigger ngOnInit subscription
      component.ngOnInit();
      
      expect(modalService.closeModal).toHaveBeenCalled();
    });

    it('should handle modal state changes when user logs out', () => {
      spyOn(modalService, 'openModal');
      
      // Simulate user logout
      authService.setCurrentUser(null);
      authService.setLoggedIn(false);
      
      // Trigger ngOnInit subscription
      component.ngOnInit();
      
      expect(modalService.openModal).toHaveBeenCalled();
    });
  });
});
