import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RecommendationsComponent } from './recommendations.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RecommendationService } from '../../services/recommendation.service';
import { BehaviorSubject, throwError } from 'rxjs';
import { DocumentDetail } from '../../services/document.service';

// Enhanced service stub for behavior testing
class EnhancedRecommendationServiceStub {
  private documentsSubject = new BehaviorSubject<DocumentDetail[]>([]);
  documents$ = this.documentsSubject.asObservable();
  
  private shouldThrowError = false;
  
  getDetailedDocuments() {
    if (this.shouldThrowError) {
      throw new Error('Service error');
    }
    // Simulate async operation that updates documents$ - use synchronous for tests
    if (!this.shouldThrowError && this.documentsSubject.value.length === 0) {
      this.documentsSubject.next(this.getMockDocuments());
    }
  }
  
  // Test helper methods
  setDocuments(documents: DocumentDetail[]) {
    this.documentsSubject.next(documents);
  }
  
  setError(shouldError: boolean) {
    this.shouldThrowError = shouldError;
  }
  
  emitError(error: string) {
    this.documentsSubject.error(new Error(error));
  }
  
  private getMockDocuments(): DocumentDetail[] {
    return [
      {
        id: 'mock-1',
        title: 'AI in Healthcare',
        author: 'Dr. Smith',
        publication_date: '2023-01-01',
        knowledge_area: 'Computer Science',
        license: 'MIT',
        repository_uri: 'https://mock.com/1',
        repository_id: 'repo-1',
        status: 'L',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      },
      {
        id: 'mock-2',
        title: 'Machine Learning Applications',
        author: 'Dr. Johnson',
        publication_date: '2023-01-02',
        knowledge_area: 'Computer Science',
        license: 'CC BY',
        repository_uri: 'https://mock.com/2',
        repository_id: 'repo-2',
        status: 'L',
        created_at: '2023-01-02',
        updated_at: '2023-01-02'
      }
    ];
  }
}

describe('RecommendationsComponent', () => {
  let component: RecommendationsComponent;
  let fixture: ComponentFixture<RecommendationsComponent>;
  let recommendationService: EnhancedRecommendationServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsComponent],
      providers: [
        { provide: RecommendationService, useClass: EnhancedRecommendationServiceStub},
        provideHttpClient(withFetch()), 
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsComponent);
    component = fixture.componentInstance;
    recommendationService = TestBed.inject(RecommendationService) as any;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      // Note: component.ngOnInit() is automatically called during fixture.detectChanges()
      // So we need to reset the service state or expect the initial behavior
      expect(component.showToast).toBeDefined();
      expect(component.toastMessage).toBeDefined();
      expect(component.toastType).toBe('error');
      expect(Array.isArray(component.recommendedDocsBack)).toBeTrue();
    });

    it('should have hardcoded sample documents', () => {
      expect(component.recommendedDocs).toBeDefined();
      expect(component.recommendedDocs.length).toBe(4);
      expect(component.recommendedDocs[0].title).toContain('Efectos de la quema de la caña de azúcar');
      expect(component.recommendedDocs[0].author).toBe('Rojas Velázquez, Montserrath');
    });

    it('should call getDetailedDocuments on init', () => {
      // The service is already called during component creation in beforeEach
      // Let's create a fresh component to test this
      const freshFixture = TestBed.createComponent(RecommendationsComponent);
      const freshComponent = freshFixture.componentInstance;
      const freshService = TestBed.inject(RecommendationService) as any;
      
      spyOn(freshService, 'getDetailedDocuments');
      
      freshComponent.ngOnInit();
      
      expect(freshService.getDetailedDocuments).toHaveBeenCalled();
    });
  });

  describe('Document Loading', () => {
    it('should successfully load documents from service', fakeAsync(() => {
      const mockDocuments = [
        {
          id: 'test-1',
          title: 'Test Document 1',
          author: 'Test Author',
          publication_date: '2023-01-01',
          knowledge_area: 'Computer Science',
          license: 'MIT',
          repository_uri: 'https://test.com/1',
          repository_id: 'test-repo-1',
          status: 'L' as const,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ];
      
      recommendationService.setDocuments(mockDocuments);
      component.ngOnInit();
      tick();
      
      expect(component.recommendedDocsBack).toEqual(mockDocuments);
    }));

    it('should handle empty document response', fakeAsync(() => {
      recommendationService.setDocuments([]);
      component.ngOnInit();
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al recibir los documentos recomendados.');
      expect(component.toastType).toBe('error');
    }));

    it('should handle service error during initialization', () => {
      recommendationService.setError(true);
      
      component.ngOnInit();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al solicitar documentos.');
    });

    it('should handle observable error from documents stream', fakeAsync(() => {
      component.ngOnInit();
      
      recommendationService.emitError('Stream error');
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al cargar documentos recomendados.');
    }));
  });

  describe('Document Structure Validation', () => {
    it('should have correctly structured hardcoded documents', () => {
      const firstDoc = component.recommendedDocs[0];
      
      expect(firstDoc.id).toBeDefined();
      expect(firstDoc.title).toBeDefined();
      expect(firstDoc.author).toBeDefined();
      expect(firstDoc.type).toBeDefined();
      expect(firstDoc.publication_date).toBeDefined();
      expect(firstDoc.knowledge_area).toBeDefined();
      expect(firstDoc.license).toBeDefined();
      expect(firstDoc.repository_uri).toBeDefined();
      expect(firstDoc.repository_id).toBeDefined();
      expect(firstDoc.status).toBeDefined();
      
      expect(typeof firstDoc.id).toBe('string');
      expect(['L', 'R', 'E']).toContain(firstDoc.status);
    });

    it('should have unique IDs for all hardcoded documents', () => {
      const ids = component.recommendedDocs.map(doc => doc.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have different titles for all hardcoded documents', () => {
      const titles = component.recommendedDocs.map(doc => doc.title);
      const uniqueTitles = new Set(titles);
      
      expect(uniqueTitles.size).toBe(titles.length);
    });
  });

  describe('Toast Notifications', () => {
    it('should show and auto-hide toast with default error type', fakeAsync(() => {
      component['showToastMessage']('Test error message');
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Test error message');
      expect(component.toastType).toBe('error');
      
      tick(4000);
      
      expect(component.showToast).toBeFalse();
    }));

    it('should show toast with custom type', fakeAsync(() => {
      component['showToastMessage']('Success message', 'success');
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Success message');
      expect(component.toastType).toBe('success');
      
      tick(4000);
      
      expect(component.showToast).toBeFalse();
    }));

    it('should show warning toast', () => {
      component['showToastMessage']('Warning message', 'warning');
      
      expect(component.toastType).toBe('warning');
      expect(component.toastMessage).toBe('Warning message');
    });
  });

  describe('Document Categories', () => {
    it('should have documents from different knowledge areas', () => {
      const knowledgeAreas = component.recommendedDocs.map(doc => doc.knowledge_area);
      const uniqueAreas = new Set(knowledgeAreas);
      
      expect(uniqueAreas.size).toBeGreaterThan(1);
      expect(knowledgeAreas).toContain('Ciencias Agrícolas');
      expect(knowledgeAreas).toContain('Medicina');
      expect(knowledgeAreas).toContain('Ciencias sociales');
    });

    it('should have all documents as thesis type', () => {
      const documentTypes = component.recommendedDocs.map(doc => doc.type);
      
      documentTypes.forEach(type => {
        expect(type).toBe('Tesis');
      });
    });

    it('should have all documents with same license', () => {
      const licenses = component.recommendedDocs.map(doc => doc.license);
      const uniqueLicenses = new Set(licenses);
      
      expect(uniqueLicenses.size).toBe(1);
      expect(Array.from(uniqueLicenses)[0]).toBe('CC BY-NC-SA 4.0');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null documents response', fakeAsync(() => {
      recommendationService.setDocuments(null as any);
      component.ngOnInit();
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al recibir los documentos recomendados.');
      
      // Clean up timer from toast
      tick(4000);
    }));

    it('should handle undefined documents response', fakeAsync(() => {
      recommendationService.setDocuments(undefined as any);
      component.ngOnInit();
      tick();
      
      expect(component.showToast).toBeTrue();
      
      // Clean up timer from toast
      tick(4000);
    }));

    it('should not crash when service throws during init', () => {
      recommendationService.setError(true);
      
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.showToast).toBeTrue();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle successful document loading flow', fakeAsync(() => {
      const mockDocuments = [
        {
          id: 'int-1',
          title: 'Integration Test Document',
          author: 'Integration Author',
          publication_date: '2023-01-01',
          knowledge_area: 'Computer Science',
          license: 'MIT',
          repository_uri: 'https://integration.test',
          repository_id: 'int-repo',
          status: 'L' as const,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ];
      
      // Start with empty state
      expect(component.recommendedDocsBack).toEqual([]);
      
      // Initialize component
      component.ngOnInit();
      
      // Simulate service returning data
      recommendationService.setDocuments(mockDocuments);
      tick();
      
      // Verify final state
      expect(component.recommendedDocsBack).toEqual(mockDocuments);
      expect(component.showToast).toBeFalse();
    }));

    it('should handle error recovery flow', fakeAsync(() => {
      // Start with error condition
      recommendationService.setError(true);
      component.ngOnInit();
      
      expect(component.showToast).toBeTrue();
      
      // Wait for toast to hide
      tick(4000);
      expect(component.showToast).toBeFalse();
      
      // Simulate service recovery with good data
      recommendationService.setError(false);
      const recoveryDocs = [{ 
        id: 'recovery-1', 
        title: 'Recovery Doc',
        author: 'Recovery Author',
        publication_date: '2023-01-01',
        knowledge_area: 'Computer Science',
        license: 'MIT',
        repository_uri: 'https://recovery.test',
        repository_id: 'recovery-repo',
        status: 'L' as const,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      }];
      recommendationService.setDocuments(recoveryDocs);
      tick();
      
      expect(component.recommendedDocsBack).toEqual(recoveryDocs);
    }));
  });

  describe('Component State Management', () => {
    it('should maintain state consistency during multiple operations', fakeAsync(() => {
      // Initial state
      expect(component.recommendedDocsBack).toEqual([]);
      
      // First load
      const docs1 = [{ 
        id: 'state-1', 
        title: 'State Test 1',
        author: 'State Author 1',
        publication_date: '2023-01-01',
        knowledge_area: 'Computer Science',
        license: 'MIT',
        repository_uri: 'https://state.test/1',
        repository_id: 'state-repo-1',
        status: 'L' as const,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      }];
      recommendationService.setDocuments(docs1);
      component.ngOnInit();
      tick();
      
      expect(component.recommendedDocsBack).toEqual(docs1);
      
      // Second load with different data
      const docs2 = [
        { 
          id: 'state-2', 
          title: 'State Test 2',
          author: 'State Author 2',
          publication_date: '2023-01-02',
          knowledge_area: 'Information Systems',
          license: 'CC BY',
          repository_uri: 'https://state.test/2',
          repository_id: 'state-repo-2',
          status: 'R' as const,
          created_at: '2023-01-02',
          updated_at: '2023-01-02'
        }
      ];
      recommendationService.setDocuments(docs2);
      tick();
      
      expect(component.recommendedDocsBack).toEqual(docs2);
      expect(component.recommendedDocsBack).not.toEqual(docs1);
    }));

    it('should preserve hardcoded documents regardless of service state', fakeAsync(() => {
      const originalHardcodedDocs = [...component.recommendedDocs];
      
      // Load from service
      recommendationService.setDocuments([]);
      component.ngOnInit();
      tick();
      
      // Hardcoded docs should remain unchanged
      expect(component.recommendedDocs).toEqual(originalHardcodedDocs);
      
      // Clean up any toast timers
      tick(4000);
      
      // Even after errors
      recommendationService.emitError('Test error');
      tick();
      
      expect(component.recommendedDocs).toEqual(originalHardcodedDocs);
      
      // Clean up error toast timers
      tick(4000);
    }));
  });
});
