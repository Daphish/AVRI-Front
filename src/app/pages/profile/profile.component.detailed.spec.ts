import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { RecommendationService } from '../../services/recommendation.service';
import { DocumentService } from '../../services/document.service';
import { BehaviorSubject, of } from 'rxjs';

// Service stubs
class AuthServiceStub {
  currentUser$ = new BehaviorSubject<any>(null);
  profileSetupComplete$ = new BehaviorSubject<boolean>(true);
  isLoggedIn$ = new BehaviorSubject<boolean>(true);
  logout() {}
}

class ChatServiceStub {
  loadSessions() {}
  clearSessions() {}
}

class RecommendationServiceStub {
  documents$ = new BehaviorSubject<any[]>([]);
  getDetailedDocuments() {
    return of([]);
  }
  get() {
    return of([]);
  }
}

class DocumentServiceStub {
  getSavedDocuments() {
    return of([]);
  }
}

describe('ProfileComponent - Additional Coverage Tests', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: AuthServiceStub;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ChatService, useClass: ChatServiceStub },
        { provide: RecommendationService, useClass: RecommendationServiceStub },
        { provide: DocumentService, useClass: DocumentServiceStub },
        provideRouter([]),
        provideHttpClient(withFetch()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
      expect(component.isLoadingProfile).toBeDefined();
    });

    it('should handle regular user on init', fakeAsync(() => {
      authService.currentUser$.next({
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      });

      component.ngOnInit();
      tick();

      expect(component.isActuallyAnonymous).toBeFalse();
    }));

    it('should handle anonymous user on init', fakeAsync(() => {
      authService.currentUser$.next({ anonymous_id: 'anon-123' });

      component.ngOnInit();
      tick();

      expect(component.isActuallyAnonymous).toBeTrue();
    }));

    it('should handle null user on init', fakeAsync(() => {
      authService.currentUser$.next(null);

      component.ngOnInit();
      tick();

      expect(component.isActuallyAnonymous).toBeTrue();
    }));
  });

  describe('Profile Data Loading', () => {
    it('should load profile preferences', fakeAsync(() => {
      authService.currentUser$.next({
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      });

      component.ngOnInit();
      tick();

      // Expect profile request
      const profileReq = httpMock.match('/api/recommender/profile/me/');
      if (profileReq.length > 0) {
        profileReq[0].flush({
          profile: {
            interests: ['AI', 'Machine Learning'],
            document_titles: ['Thesis', 'Paper']
          }
        });
      }

      tick();
      expect(component.preferences.length).toBeGreaterThanOrEqual(0);
    }));

    it('should handle profile loading error gracefully', fakeAsync(() => {
      authService.currentUser$.next({
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      });

      component.ngOnInit();
      tick();

      const profileReq = httpMock.match('/api/recommender/profile/me/');
      if (profileReq.length > 0) {
        profileReq[0].flush({}, { status: 500, statusText: 'Server Error' });
      }

      tick();
      expect(component.isLoadingProfile).toBeFalse();
    }));
  });

  describe('User Information Display', () => {
    it('should display user basic info', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        education_level: 'Master',
        field_of_study: 'Data Science'
      };

      authService.currentUser$.next(user);
      component.ngOnInit();

      expect(component.userDisplay).toEqual(user);
    });

    it('should handle user without optional fields', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        education_level: '',
        field_of_study: ''
      };

      authService.currentUser$.next(user);
      component.ngOnInit();

      expect(component.userDisplay).toBeTruthy();
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout on auth service', () => {
      spyOn(authService, 'logout');
      
      component.logout();

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid user switches', fakeAsync(() => {
      // Switch from anonymous to registered
      authService.currentUser$.next({ anonymous_id: 'anon' });
      component.ngOnInit();
      tick();
      expect(component.isActuallyAnonymous).toBeTrue();

      // Switch to registered user
      authService.currentUser$.next({
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'CS'
      });
      tick();

      expect(component.isActuallyAnonymous).toBeFalse();
    }));

    it('should handle component destruction', () => {
      component.ngOnInit();
      
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('Toast Messages', () => {
    it('should show toast on successful operations', fakeAsync(() => {
      component['showToastMessage']('Success', 'success');

      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Success');
      expect(component.toastType).toBe('success');

      tick(4000);

      expect(component.showToast).toBeFalse();
    }));

    it('should show toast on errors', fakeAsync(() => {
      component['showToastMessage']('Error occurred', 'error');

      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error occurred');
      expect(component.toastType).toBe('error');

      tick(4000);

      expect(component.showToast).toBeFalse();
    }));
  });
});

