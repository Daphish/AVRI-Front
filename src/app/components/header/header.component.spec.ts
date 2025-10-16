import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventoEncuestaService } from '../../services/evento-encuesta.service';
import { BehaviorSubject } from 'rxjs';

// Enhanced service stubs for behavior testing
class EnhancedAuthServiceStub {
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  profileSetupComplete$ = new BehaviorSubject<boolean>(true);
  
  autoLogin() { return Promise.resolve(true); }
  login() { return Promise.resolve(true); }
  logout() {}
  getToken() { return null; }
  
  // Test helper methods
  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
  }
}

class EnhancedEventoEncuestaServiceStub {
  lanzarEncuesta() {}
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: EnhancedAuthServiceStub;
  let encuestaService: EnhancedEventoEncuestaServiceStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useClass: EnhancedAuthServiceStub },
        { provide: EventoEncuestaService, useClass: EnhancedEventoEncuestaServiceStub },
        provideRouter([
          { path: 'fyp', component: HeaderComponent }
        ]),
        provideHttpClient(withFetch()), 
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    encuestaService = TestBed.inject(EventoEncuestaService) as any;
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default role values', () => {
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });
  });

  describe('User State Management', () => {
    it('should set roles to false when no user', () => {
      authService.setCurrentUser(null);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should set roles to false for anonymous users', () => {
      const anonymousUser = { anonymous_id: 'anon-123' };
      authService.setCurrentUser(anonymousUser);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should set author role when user is author', () => {
      const authorUser = { id: 1, email: 'author@test.com', is_author: true };
      authService.setCurrentUser(authorUser);
      
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeFalse();
    });

    it('should set staff role when user is staff', () => {
      const staffUser = { id: 1, email: 'staff@test.com', is_staff: true };
      authService.setCurrentUser(staffUser);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeTrue();
    });

    it('should set both roles when user is both author and staff', () => {
      const superUser = { 
        id: 1, 
        email: 'super@test.com', 
        is_author: true, 
        is_staff: true 
      };
      authService.setCurrentUser(superUser);
      
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeTrue();
    });

    it('should handle falsy role values correctly', () => {
      const userWithFalsyRoles = { 
        id: 1, 
        email: 'user@test.com', 
        is_author: false, 
        is_staff: null 
      };
      authService.setCurrentUser(userWithFalsyRoles);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should handle truthy non-boolean role values', () => {
      const userWithTruthyRoles = { 
        id: 1, 
        email: 'user@test.com', 
        is_author: 'yes', 
        is_staff: 1 
      };
      authService.setCurrentUser(userWithTruthyRoles);
      
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeTrue();
    });
  });

  describe('Role State Changes', () => {
    it('should update roles when user changes', () => {
      // Start with regular user
      const regularUser = { id: 1, email: 'user@test.com' };
      authService.setCurrentUser(regularUser);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
      
      // Change to author user
      const authorUser = { id: 1, email: 'user@test.com', is_author: true };
      authService.setCurrentUser(authorUser);
      
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeFalse();
      
      // Change to staff user
      const staffUser = { id: 1, email: 'user@test.com', is_staff: true };
      authService.setCurrentUser(staffUser);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeTrue();
    });

    it('should reset roles when user logs out', () => {
      // Start with privileged user
      const superUser = { id: 1, email: 'super@test.com', is_author: true, is_staff: true };
      authService.setCurrentUser(superUser);
      
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeTrue();
      
      // User logs out
      authService.setCurrentUser(null);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate to fyp page when viewFYP is called', () => {
      spyOn(router, 'navigate');
      
      component.viewFYP();
      
      expect(router.navigate).toHaveBeenCalledWith(['/fyp']);
    });
  });

  describe('Survey Functions', () => {
    it('should trigger survey when abrirEncuesta is called', () => {
      spyOn(encuestaService, 'lanzarEncuesta');
      
      component.abrirEncuesta();
      
      expect(encuestaService.lanzarEncuesta).toHaveBeenCalled();
    });
  });

  describe('User Type Detection', () => {
    it('should correctly identify anonymous users', () => {
      const anonymousUser = { 
        anonymous_id: 'anon-456',
        some_other_property: 'value'
      };
      authService.setCurrentUser(anonymousUser);
      
      // Anonymous users should have no roles
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should correctly identify registered users without roles', () => {
      const regularUser = { 
        id: 1,
        email: 'regular@test.com',
        name: 'Regular User'
      };
      authService.setCurrentUser(regularUser);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should handle users with mixed properties', () => {
      const mixedUser = { 
        id: 1,
        email: 'mixed@test.com',
        anonymous_id: 'should-be-ignored', // This shouldn't matter since id exists
        is_author: true,
        is_staff: false
      };
      authService.setCurrentUser(mixedUser);
      
      // Should treat as regular user since it has id
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeFalse();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user object', () => {
      const emptyUser = {};
      authService.setCurrentUser(emptyUser);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should handle user with undefined role properties', () => {
      const userWithUndefinedRoles = { 
        id: 1,
        email: 'test@test.com',
        is_author: undefined,
        is_staff: undefined
      };
      authService.setCurrentUser(userWithUndefinedRoles);
      
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });

    it('should handle rapid user changes', () => {
      // Simulate rapid user switching
      authService.setCurrentUser({ id: 1, is_author: true });
      expect(component.is_author).toBeTrue();
      
      authService.setCurrentUser({ id: 2, is_staff: true });
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeTrue();
      
      authService.setCurrentUser(null);
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });
  });

  describe('Integration Scenarios', () => {
    it('should maintain correct state during authentication flow', () => {
      // Start logged out
      authService.setCurrentUser(null);
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
      
      // Login as regular user
      authService.setCurrentUser({ id: 1, email: 'user@test.com' });
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
      
      // User gains author privileges
      authService.setCurrentUser({ id: 1, email: 'user@test.com', is_author: true });
      expect(component.is_author).toBeTrue();
      expect(component.is_staff).toBeFalse();
      
      // Switch to anonymous
      authService.setCurrentUser({ anonymous_id: 'temp-user' });
      expect(component.is_author).toBeFalse();
      expect(component.is_staff).toBeFalse();
    });
  });
});
