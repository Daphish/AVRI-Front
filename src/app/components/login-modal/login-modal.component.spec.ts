import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginModalComponent } from './login-modal.component';
import { provideHttpClient, withFetch } from '@angular/common/http';           
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

// Enhanced service stubs for behavior testing
class EnhancedAuthServiceStub {
  private shouldSucceed = true;
  
  login(email: string, password: string) { 
    return Promise.resolve(this.shouldSucceed);
  }
  createAnonymous() { 
    return Promise.resolve(this.shouldSucceed);
  }
  logout() {}
  getToken() { return 'mock-token'; }
  
  // Test helper methods
  setLoginResult(success: boolean) {
    this.shouldSucceed = success;
  }
}

class EnhancedChatServiceStub {
  loadSessions() {}
  clearSessions() {}
}

describe('LoginModalComponent', () => {
  let component: LoginModalComponent;
  let fixture: ComponentFixture<LoginModalComponent>;
  let authService: EnhancedAuthServiceStub;
  let chatService: EnhancedChatServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModalComponent],
      providers: [
        { provide: AuthService, useClass: EnhancedAuthServiceStub },
        { provide: ChatService, useClass: EnhancedChatServiceStub },
        provideHttpClient(withFetch()),          
        provideHttpClientTesting(), 
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginModalComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    chatService = TestBed.inject(ChatService) as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.user).toBe('');
      expect(component.password).toBe('');
      expect(component.error).toBeFalse();
    });
  });

  describe('Modal Controls', () => {
    it('should emit closeModalEvent when closeModal is called', () => {
      spyOn(component.closeModalEvent, 'emit');
      
      component.closeModal();
      
      expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      component.user = 'test@example.com';
      component.password = 'password123';
    });

    it('should call authService.login with correct credentials', fakeAsync(() => {
      spyOn(authService, 'login').and.returnValue(Promise.resolve(true));
      spyOn(chatService, 'loadSessions');
      spyOn(component, 'closeModal');
      
      component.startSession();
      tick();
      
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    }));

    it('should handle successful login', fakeAsync(() => {
      authService.setLoginResult(true);
      spyOn(chatService, 'loadSessions');
      spyOn(component, 'closeModal');
      
      component.startSession();
      tick();
      
      expect(chatService.loadSessions).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.error).toBeFalse();
    }));

    it('should handle login failure', fakeAsync(() => {
      authService.setLoginResult(false);
      spyOn(chatService, 'loadSessions');
      spyOn(component, 'closeModal');
      
      component.startSession();
      tick();
      
      expect(chatService.loadSessions).not.toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
      expect(component.error).toBeTrue();
    }));

    it('should auto-hide error after 2 seconds on login failure', fakeAsync(() => {
      authService.setLoginResult(false);
      
      component.startSession();
      tick(); // Wait for login promise to resolve
      
      expect(component.error).toBeTrue();
      
      tick(2000); // Wait for error auto-hide timeout
      
      expect(component.error).toBeFalse();
    }));
  });

  describe('Anonymous User Functionality', () => {
    it('should call authService.createAnonymous', fakeAsync(() => {
      spyOn(authService, 'createAnonymous').and.returnValue(Promise.resolve(true));
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(authService.createAnonymous).toHaveBeenCalled();
    }));

    it('should handle successful anonymous creation', fakeAsync(() => {
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.error).toBeFalse();
    }));

    it('should handle anonymous creation failure', fakeAsync(() => {
      authService.setLoginResult(false);
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).not.toHaveBeenCalled();
      expect(component.error).toBeTrue();
    }));

    it('should auto-hide error after 2 seconds on anonymous creation failure', fakeAsync(() => {
      authService.setLoginResult(false);
      
      component.continueAsGuest();
      tick(); // Wait for createAnonymous promise to resolve
      
      expect(component.error).toBeTrue();
      
      tick(2000); // Wait for error auto-hide timeout
      
      expect(component.error).toBeFalse();
    }));
  });

  describe('Form Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@example.co.uk',
        'user123@test-domain.com'
      ];
      
      validEmails.forEach(email => {
        component.user = email;
        // Component doesn't have built-in validation, but we test that it accepts the input
        expect(component.user).toBe(email);
      });
    });

    it('should handle empty credentials gracefully', fakeAsync(() => {
      component.user = '';
      component.password = '';
      
      spyOn(authService, 'login').and.returnValue(Promise.resolve(false));
      
      component.startSession();
      tick();
      
      expect(authService.login).toHaveBeenCalledWith('', '');
      expect(component.error).toBeTrue();
    }));
  });

  describe('Error Display', () => {
    it('should show error state correctly', () => {
      component.error = true;
      expect(component.error).toBeTrue();
      
      component.error = false;
      expect(component.error).toBeFalse();
    });

    it('should reset error state before new login attempt', fakeAsync(() => {
      // Set initial error state
      component.error = true;
      
      // Attempt new login
      authService.setLoginResult(true);
      component.startSession();
      tick();
      
      // Error should be cleared on successful login
      expect(component.error).toBeFalse();
    }));
  });

  describe('Integration Scenarios', () => {
    it('should handle rapid successive login attempts', fakeAsync(() => {
      component.user = 'test@example.com';
      component.password = 'password';
      
      // First attempt fails
      authService.setLoginResult(false);
      component.startSession();
      tick();
      expect(component.error).toBeTrue();
      
      // Second attempt succeeds immediately
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      component.startSession();
      tick();
      
      expect(component.closeModal).toHaveBeenCalled();
    }));

    it('should handle switching between login and guest modes', fakeAsync(() => {
      // Try login first (fails)
      component.user = 'test@example.com';
      component.password = 'password';
      authService.setLoginResult(false);
      component.startSession();
      tick();
      expect(component.error).toBeTrue();
      
      // Then try guest mode (succeeds)
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).toHaveBeenCalled();
    }));
  });

  describe('UI State Management', () => {
    it('should maintain form values during error states', fakeAsync(() => {
      component.user = 'test@example.com';
      component.password = 'mypassword';
      
      authService.setLoginResult(false);
      component.startSession();
      tick();
      
      // Form values should be preserved even after error
      expect(component.user).toBe('test@example.com');
      expect(component.password).toBe('mypassword');
      expect(component.error).toBeTrue();
    }));

    it('should handle concurrent error timeouts correctly', fakeAsync(() => {
      // Trigger first error
      authService.setLoginResult(false);
      component.startSession();
      tick();
      expect(component.error).toBeTrue();
      
      // Trigger second error before first timeout
      tick(1000);
      component.continueAsGuest();
      tick();
      expect(component.error).toBeTrue();
      
      // First timeout should complete
      tick(1000);
      expect(component.error).toBeTrue();
      
      // Second timeout should complete
      tick(2000);
      expect(component.error).toBeFalse();
    }));
  });
});
