import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { RecommendationService } from '../../services/recommendation.service';
import { DocumentService } from '../../services/document.service';
import { BehaviorSubject, of, throwError } from 'rxjs';

// Enhanced service stubs for behavior testing
class EnhancedAuthServiceStub {
  private currentUserSubject = new BehaviorSubject<any>(null);
  private profileCompleteSubject = new BehaviorSubject<boolean>(false);
  
  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  profileSetupComplete$ = this.profileCompleteSubject.asObservable();
  
  autoLogin() { return Promise.resolve(true); }
  login() { return Promise.resolve(true); }
  logout() {}
  getToken() { return null; }
  markProfileAsCompleted(status: boolean) {
    this.profileCompleteSubject.next(status);
  }
  
  // Test helper methods
  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
  }
  
  setProfileComplete(status: boolean) {
    this.profileCompleteSubject.next(status);
  }
}

class EnhancedChatServiceStub {
  pendingWizard = false;
  clearSessions() {}
}

class EnhancedRecommendationServiceStub {
  private shouldSucceed = true;
  private profileData: any = null;
  
  get() {
    if (this.shouldSucceed) {
      return of(this.profileData);
    } else {
      return throwError(() => new Error('Failed to load profile'));
    }
  }
  
  // Test helper methods
  setProfileData(data: any) {
    this.profileData = data;
  }
  
  setRequestResult(success: boolean) {
    this.shouldSucceed = success;
  }
}

class EnhancedDocumentServiceStub {
  private savedDocs: any[] = [];
  
  getSavedDocuments() {
    return of(this.savedDocs);
  }
  
  // Test helper methods
  setSavedDocuments(docs: any[]) {
    this.savedDocs = docs;
  }
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: EnhancedAuthServiceStub;
  let chatService: EnhancedChatServiceStub;
  let recommendationService: EnhancedRecommendationServiceStub;
  let documentService: EnhancedDocumentServiceStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useClass: EnhancedAuthServiceStub },
        { provide: ChatService, useClass: EnhancedChatServiceStub },
        { provide: RecommendationService, useClass: EnhancedRecommendationServiceStub },
        { provide: DocumentService, useClass: EnhancedDocumentServiceStub },
        provideRouter([
          { path: 'home', component: ProfileComponent }
        ]),
        provideHttpClient(withFetch()),
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    chatService = TestBed.inject(ChatService) as any;
    recommendationService = TestBed.inject(RecommendationService) as any;
    documentService = TestBed.inject(DocumentService) as any;
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.showToast).toBeFalse();
      expect(component.toastMessage).toBe('');
      expect(component.toastType).toBe('error');
      expect(component.userDisplay).toBeNull();
      expect(component.isActuallyAnonymous).toBeTrue();
      expect(component.profileNeedsSetup).toBeFalse();
    });
  });

  describe('User State Management', () => {
    it('should handle regular user login', () => {
      const regularUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      };
      authService.setCurrentUser(regularUser);
      
      component.ngOnInit();
      
      expect(component.isActuallyAnonymous).toBeFalse();
      expect(component.userDisplay).toEqual(regularUser);
    });

    it('should handle anonymous user', () => {
      const anonymousUser = { anonymous_id: 'anon-123' };
      authService.setCurrentUser(anonymousUser);
      
      component.ngOnInit();
      
      expect(component.isActuallyAnonymous).toBeTrue();
      expect(component.userDisplay).toBeNull();
      expect(component.preferences).toContain('Inicia sesión para ver y configurar tu perfil.');
    });

    it('should handle null user', () => {
      authService.setCurrentUser(null);
      
      component.ngOnInit();
      
      expect(component.isActuallyAnonymous).toBeTrue();
      expect(component.userDisplay).toBeNull();
    });

    it('should set profile setup status correctly', () => {
      const regularUser = { id: 1, email: 'test@example.com' };
      authService.setCurrentUser(regularUser);
      
      component.ngOnInit();
      component.isActuallyAnonymous = false; // Simulate regular user
      
      authService.setProfileComplete(true);
      expect(component.profileNeedsSetup).toBeFalse();
      
      authService.setProfileComplete(false);
      expect(component.profileNeedsSetup).toBeTrue();
    });
  });

  describe('Profile Data Loading', () => {
    beforeEach(() => {
      const regularUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      };
      authService.setCurrentUser(regularUser);
      component.isActuallyAnonymous = false;
      component.userDisplay = regularUser;
    });

    it('should load preferences successfully', () => {
      const profileData = {
        profile: {
          interests: ['AI', 'Machine Learning', 'Data Science']
        }
      };
      recommendationService.setProfileData(profileData);
      
      component.loadProfileData();
      
      expect(component.preferences).toEqual(['AI', 'Machine Learning', 'Data Science']);
    });

    it('should handle empty preferences', () => {
      const profileData = {
        profile: {
          interests: []
        }
      };
      recommendationService.setProfileData(profileData);
      
      component.loadProfileData();
      
      expect(component.preferences).toContain('Aún no has configurado tus preferencias.');
    });

    it('should handle missing profile data', () => {
      recommendationService.setProfileData(null);
      
      component.loadProfileData();
      
      expect(component.preferences).toContain('Configura tus preferencias para mejores recomendaciones.');
    });

    it('should handle profile loading error', () => {
      spyOn(authService, 'markProfileAsCompleted');
      recommendationService.setRequestResult(false);
      
      component.loadProfileData();
      
      expect(component.preferences).toContain('Error al cargar preferencias. Intenta configurar tu perfil.');
      expect(authService.markProfileAsCompleted).toHaveBeenCalledWith(false);
      expect(component.showToast).toBeTrue();
    });

    it('should load saved documents', () => {
      const savedDocs = [
        {
          id: '1',
          document: {
            id: 'doc-1',
            title: 'Test Document',
            author: 'Test Author',
            publication_date: '2023-01-01',
            knowledge_area: 'Computer Science',
            license: 'MIT',
            repository_uri: 'https://example.com',
            repository_id: 'repo-1',
            status: 'L' as const,
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
          }
        }
      ];
      documentService.setSavedDocuments(savedDocs);
      
      component.loadProfileData();
      
      expect(component.documents).toEqual(savedDocs);
    });

    it('should show placeholder when no saved documents', () => {
      documentService.setSavedDocuments([]);
      
      component.loadProfileData();
      
      expect(component.documents.length).toBe(1);
      expect(component.documents[0].document.title).toBe('No hay documentos para mostrar.');
    });

    it('should not load data for anonymous users', () => {
      component.isActuallyAnonymous = true;
      spyOn(recommendationService, 'get');
      
      component.loadProfileData();
      
      expect(recommendationService.get).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate back and set pending wizard when profile incomplete', fakeAsync(() => {
      spyOn(router, 'navigate');
      authService.setProfileComplete(false);
      
      component.goBack();
      tick();
      
      expect(chatService.pendingWizard).toBeTrue();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should show wizard and navigate to home', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      component.showWizard();
      tick();
      
      expect(chatService.pendingWizard).toBeTrue();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));
  });

  describe('Logout Functionality', () => {
    it('should logout successfully', async () => {
      spyOn(chatService, 'clearSessions');
      spyOn(authService, 'logout');
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      
      await component.logout();
      
      expect(chatService.clearSessions).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe('success');
    });

    it('should handle logout error', () => {
      spyOn(chatService, 'clearSessions').and.throwError('Error');
      
      component.logout();
      
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

    it('should default to error toast type', () => {
      component['showToastMessage']('Error message');
      
      expect(component.toastType).toBe('error');
    });
  });

  describe('Observable Streams', () => {
    it('should emit true when user is logged in and not anonymous', (done) => {
      const regularUser = { id: 1, email: 'test@example.com' };
      authService.setCurrentUser(regularUser);
      
      component.isUserLoggedInAndNotAnonymous$.subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
    });

    it('should emit false for anonymous users', (done) => {
      const anonymousUser = { anonymous_id: 'anon-123' };
      authService.setCurrentUser(anonymousUser);
      
      component.isUserLoggedInAndNotAnonymous$.subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should emit false when no user', (done) => {
      authService.setCurrentUser(null);
      
      component.isUserLoggedInAndNotAnonymous$.subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });
  });

  describe('Default Documents Placeholder', () => {
    it('should return correct placeholder structure', () => {
      const placeholder = component['getDefaultDocumentsPlaceholder']();
      
      expect(placeholder.length).toBe(1);
      expect(placeholder[0].document.title).toBe('No hay documentos para mostrar.');
      expect(placeholder[0].document.author).toBe('Sin autor');
      expect(placeholder[0].document.status).toBe('L');
    });
  });

  describe('Subscription Management', () => {
    it('should unsubscribe on destroy', () => {
      const subscriptions = (component as any).subscriptions;
      spyOn(subscriptions, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(subscriptions.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user profile flow', () => {
      // Anonymous user first
      const anonymousUser = { anonymous_id: 'anon-123' };
      authService.setCurrentUser(anonymousUser);
      component.ngOnInit();
      
      expect(component.isActuallyAnonymous).toBeTrue();
      
      // Switch to regular user
      const regularUser = {
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      };
      authService.setCurrentUser(regularUser);
      component.ngOnInit();
      
      expect(component.isActuallyAnonymous).toBeFalse();
      expect(component.userDisplay).toEqual(regularUser);
    });

    it('should handle profile data loading with mixed states', () => {
      const regularUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        education_level: 'Bachelor',
        field_of_study: 'Computer Science'
      };
      authService.setCurrentUser(regularUser);
      component.isActuallyAnonymous = false;
      component.userDisplay = regularUser;
      
      // Set up profile data
      const profileData = {
        profile: {
          interests: ['AI', 'Machine Learning']
        }
      };
      recommendationService.setProfileData(profileData);
      
      // Set up saved documents
      const savedDocs = [{
        id: '1',
        document: {
          id: 'doc-1',
          title: 'AI Research',
          author: 'Dr. Smith',
          publication_date: '2023-01-01',
          knowledge_area: 'AI',
          license: 'MIT',
          repository_uri: 'https://example.com',
          repository_id: 'repo-1',
          status: 'L' as const,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      }];
      documentService.setSavedDocuments(savedDocs);
      
      component.loadProfileData();
      
      expect(component.preferences).toEqual(['AI', 'Machine Learning']);
      expect(component.documents).toEqual(savedDocs);
    });

    it('should handle wizard flow correctly', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      // Test showing wizard
      component.showWizard();
      tick();
      
      expect(chatService.pendingWizard).toBeTrue();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
      
      // Reset for go back test
      chatService.pendingWizard = false;
      
      // Test going back with incomplete profile
      authService.setProfileComplete(false);
      component.goBack();
      tick();
      
      expect(chatService.pendingWizard).toBeTrue();
    }));
  });
});
