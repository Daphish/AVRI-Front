import { ComponentFixture, TestBed, fakeAsync, tick, flush, discardPeriodicTasks } from '@angular/core/testing';
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
      expect(component.emailTouched).toBeFalse();
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
      expect(component.toastType).toBe('success');

      endTimers();
    }));

    it('should handle anonymous creation failure', fakeAsync(() => {
      authService.setLoginResult(false);
      spyOn(component, 'closeModal');
      
      component.continueAsGuest();
      tick();
      
      expect(component.closeModal).not.toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('error');

      endTimers();
    }));

    it('should auto-hide toast after 4 seconds on anonymous creation failure', fakeAsync(() => {
      authService.setLoginResult(false);
      
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
        expect(component.isEmailValid()).toBeTrue();
        expect(component.user).toBe(email);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'no@domain',
        'spaces in@email.com',
        'double@@domain.com',
        'nodomain@.com'
      ];
      
      invalidEmails.forEach(email => {
        component.user = email;
        expect(component.isEmailValid()).toBeFalse();
      });
    });

    it('should show email error when touched and invalid', () => {
      component.user = 'invalidemail';
      component.emailTouched = false;
      expect(component.showEmailError()).toBeFalse();
      
      component.emailTouched = true;
      expect(component.showEmailError()).toBeTrue();
    });

    it('should not show error for valid email', () => {
      component.user = 'valid@email.com';
      component.emailTouched = true;
      expect(component.showEmailError()).toBeFalse();
    });

    it('should mark email as touched on blur', () => {
      component.emailTouched = false;
      component.onEmailBlur();
      expect(component.emailTouched).toBeTrue();
    });

    it('should mark email as touched on input when user starts typing', () => {
      component.emailTouched = false;
      component.user = '';
      component.onEmailInput();
      expect(component.emailTouched).toBeFalse(); // Still false because no text
      
      component.user = 'a';
      component.onEmailInput();
      expect(component.emailTouched).toBeTrue(); // Now true because has text
    });

    it('should disable login button when email is invalid', () => {
      component.user = 'invalid';
      component.password = 'password123';
      expect(component.canSubmitLogin()).toBeFalse();
    });

    it('should enable login button when all fields are valid', () => {
      component.user = 'valid@email.com';
      component.password = 'password123';
      expect(component.canSubmitLogin()).toBeTrue();
    });

    it('should disable register button when email is invalid', () => {
      component.name = 'John';
      component.firstName = 'Doe';
      component.lastName = 'Smith';
      component.user = 'invalid';
      component.password = 'password123';
      expect(component.canSubmitRegister()).toBeFalse();
    });

    it('should disable register button when any required field is empty', () => {
      component.name = '';
      component.firstName = 'Doe';
      component.lastName = 'Smith';
      component.user = 'valid@email.com';
      component.password = 'password123';
      expect(component.canSubmitRegister()).toBeFalse();
    });

    it('should enable register button when all fields are valid', () => {
      component.name = 'John';
      component.firstName = 'Doe';
      component.lastName = 'Smith';
      component.user = 'valid@email.com';
      component.password = 'password123';
      expect(component.canSubmitRegister()).toBeTrue();
    });

    it('should reset email validation state when toggling register modal', () => {
      component.emailTouched = true;
      component.user = 'test@email.com';
      component.toggleRegisterModal();
      expect(component.emailTouched).toBeFalse();
      expect(component.user).toBe('');
    });

    it('should handle empty credentials gracefully', fakeAsync(() => {
      component.user = '';
      component.password = '';
      
      // Should not be able to submit with empty credentials
      expect(component.canSubmitLogin()).toBeFalse();

      endTimers();
    }));

    it('should trim whitespace in email validation', () => {
      component.user = '  valid@email.com  ';
      expect(component.isEmailValid()).toBeTrue();
    });
  });

  describe('Toast Display', () => {
    it('should show toast state correctly', () => {
      component.showToast = true;
      expect(component.showToast).toBeTrue();
      
      component.showToast = false;
      expect(component.showToast).toBeFalse();
    });

    it('should show success toast on successful login', fakeAsync(() => {
      authService.setLoginResult(true);
      spyOn(component, 'closeModal');
      
      component.startSession();
      tick();
      
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
      expect(component.toastType).toBe('success');

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
      // Trigger first toast
      authService.setLoginResult(false);
      component.startSession();
      tick();
      expect(component.showToast).toBeTrue();
      
      // Trigger second toast before first timeout
      tick(2000);
      component.continueAsGuest();
      tick();
      expect(component.showToast).toBeTrue();
      
      // First timeout should complete
      tick(2000);
      expect(component.showToast).toBeTrue();
      
      // Second timeout should complete
      tick(4000);
      expect(component.showToast).toBeFalse();

      endTimers();
    }));
  });

  it('coverage: multiple failures only clear toast after the last timer expires', fakeAsync(() => {
  (authService as any).setLoginResult(false);

    // First failed attempt
    component.startSession();
    tick();
    expect(component.showToast).toBeTrue();

    // Second failed attempt before the first 4s timeout ends
    tick(2000);
    component.continueAsGuest();
    tick();
    expect(component.showToast).toBeTrue();

    // First timeout finishes — toast should still be true (second timer pending)
    tick(2000);
    expect(component.showToast).toBeTrue();

    // Second timeout finishes — toast should clear now
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
