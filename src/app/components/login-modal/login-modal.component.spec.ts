import { ComponentFixture, TestBed, fakeAsync, tick, flush, discardPeriodicTasks } from '@angular/core/testing';
import { LoginModalComponent } from './login-modal.component';
import { provideHttpClient, withFetch } from '@angular/common/http';           
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

// Enhanced service stubs for behavior testing
class EnhancedAuthServiceStub {
  private shouldSucceed = true;
  private anonymousResult = true;
  
  login(email: string, password: string) { 
    return Promise.resolve(this.shouldSucceed);
  }
  createAnonymous() { 
    return Promise.resolve(this.anonymousResult);
  }
  logout() {}
  getToken() { return 'mock-token'; }
  
  // Test helper methods
  setLoginResult(success: boolean) {
    this.shouldSucceed = success;
  }
  
  setAnonymousResult(success: boolean) {
    this.anonymousResult = success;
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

  const endTimers = () => {
    flush();
    discardPeriodicTasks();
  };

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

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.user).toBe('');
      expect(component.password).toBe('');
      expect(component.showToast).toBeFalse();
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
      endTimers();
    }));

    it('should handle successful login', fakeAsync(() => {
      authService.setLoginResult(true);
      spyOn(chatService, 'loadSessions');
      spyOn(component, 'closeModal');
      
      component.startSession();
      tick();
      
      expect(chatService.loadSessions).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('success');

      endTimers();
    }));

    it('should handle login failure', fakeAsync(() => {
      authService.setLoginResult(false);
      spyOn(chatService, 'loadSessions');
      spyOn(component, 'closeModal');
      
      component.startSession();
      tick();
      
      expect(chatService.loadSessions).not.toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');

      endTimers();
    }));

    it('should auto-hide toast after 4 seconds on login failure', fakeAsync(() => {
      authService.setLoginResult(false);
      
      component.startSession();
      tick(); // Wait for login promise to resolve
      
      expect(component.showToast).toBeTrue();
      
      tick(4000); // Wait for toast auto-hide timeout
      
      expect(component.showToast).toBeFalse();

      endTimers();
    }));
  });

  describe('Anonymous User Functionality', () => {
    it('should call authService.createAnonymous', fakeAsync(() => {
      spyOn(authService, 'createAnonymous').and.returnValue(Promise.resolve(true));
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(authService.createAnonymous).toHaveBeenCalled();

      endTimers();
    }));

    it('should handle successful anonymous creation', fakeAsync(() => {
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('success');

      endTimers();
    }));

    it('should handle anonymous creation failure', fakeAsync(() => {
      authService.setAnonymousResult(false); // Use setAnonymousResult, not setLoginResult
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).not.toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');

      endTimers();
    }));

    it('should auto-hide toast after 4 seconds on anonymous creation failure', fakeAsync(() => {
      authService.setAnonymousResult(false); // Use setAnonymousResult, not setLoginResult
      
      component.continueAsGuest();
      tick(); // Wait for createAnonymous promise to resolve
      
      expect(component.showToast).toBeTrue();
      
      tick(4000); // Wait for toast auto-hide timeout
      
      expect(component.showToast).toBeFalse();

      endTimers();
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
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');

      endTimers();
    }));
  });

  describe('Toast Display', () => {
    it('should show toast state correctly', () => {
      component.showToast = true;
      expect(component.showToast).toBeTrue();
      
      component.showToast = false;
      expect(component.showToast).toBeFalse();
    });

    it('should show toast after login attempt', fakeAsync(() => {
      // Attempt new login
      authService.setLoginResult(true);
      component.startSession();
      tick();
      
      // Toast should be shown on successful login
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('success');

      endTimers();
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
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');
      
      // Second attempt succeeds immediately
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      component.startSession();
      tick();
      
      expect(component.closeModal).toHaveBeenCalled();

      endTimers();
    }));

    it('should handle switching between login and guest modes', fakeAsync(() => {
      // Try login first (fails)
      component.user = 'test@example.com';
      component.password = 'password';
      authService.setLoginResult(false);
      component.startSession();
      tick();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');
      
      // Then try guest mode (succeeds)
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).toHaveBeenCalled();

      endTimers();
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
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');

      endTimers();
    }));

    it('should handle concurrent toast timeouts correctly', fakeAsync(() => {
      // Trigger first error
      authService.setLoginResult(false);
      component.startSession();
      tick();
      expect(component.showToast).toBeTrue();
      
      // Wait for toast to auto-hide
      tick(4000);
      expect(component.showToast).toBeFalse();
      
      // Trigger second error
      authService.setAnonymousResult(false);
      component.continueAsGuest();
      tick();
      expect(component.showToast).toBeTrue();
      
      // Wait for second toast to auto-hide
      tick(4000);
      expect(component.showToast).toBeFalse();

      endTimers();
    }));
  });

  it('coverage: multiple failures show toast with correct timing', fakeAsync(() => {
    (authService as any).setLoginResult(false);

    // First failed attempt
    component.startSession();
    tick();
    expect(component.showToast).toBeTrue();
    expect(component.toastType).toBe('error');

    // Wait for first toast to hide
    tick(4000);
    expect(component.showToast).toBeFalse();
    
    // Second failed attempt
    (authService as any).setAnonymousResult(false);
    component.continueAsGuest();
    tick();
    expect(component.showToast).toBeTrue();

    // Wait for second toast to hide
    tick(4000);
    expect(component.showToast).toBeFalse();

    endTimers();
  }));

  it('coverage: closeModal does not change toast flag', fakeAsync(() => {
    (authService as any).setLoginResult(false);
    component.startSession();
    tick();
    expect(component.showToast).toBeTrue();

    component.closeModal(); // emits only; should not touch toast
    expect(component.showToast).toBeTrue();

    endTimers();
  }));

});
