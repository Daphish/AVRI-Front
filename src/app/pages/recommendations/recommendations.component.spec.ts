import { ComponentFixture, TestBed, fakeAsync, tick, flush} from '@angular/core/testing';
import { RecommendationsComponent } from './recommendations.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RecommendationService } from '../../services/recommendation.service';
import { DocumentService } from '../../services/document.service';
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
    // // Don't auto-emit in getDetailedDocuments - let tests control the flow
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
}

class EnhancedDocumentServiceStub {
  setCurrentDocument(document: DocumentDetail) {}
}

describe('RecommendationsComponent', () => {
  let component: RecommendationsComponent;
  let fixture: ComponentFixture<RecommendationsComponent>;
  let recommendationService: EnhancedRecommendationServiceStub;
  let documentService: EnhancedDocumentServiceStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsComponent],
      providers: [
        { provide: RecommendationService, useClass: EnhancedRecommendationServiceStub},
        { provide: DocumentService, useClass: EnhancedDocumentServiceStub },
        provideRouter([
          { path: 'document', component: RecommendationsComponent }
        ]),
        provideHttpClient(withFetch()), 
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsComponent);
    component = fixture.componentInstance;
    recommendationService = TestBed.inject(RecommendationService) as any;
    documentService = TestBed.inject(DocumentService) as any;
    router = TestBed.inject(Router);
    
    // DON'T call detectChanges here - let each test control initialization
  });

   afterEach(fakeAsync(() => {
    flush(); // Clean up any pending timers
  }));

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
      spyOn(recommendationService, 'getDetailedDocuments');
  
      component.ngOnInit();
      
      expect(recommendationService.getDetailedDocuments).toHaveBeenCalled();
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
      flush();
    }));

    it('should handle empty document response', fakeAsync(() => {
      recommendationService.setDocuments([]);
      component.ngOnInit();
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al recibir los documentos recomendados.');
      expect(component.toastType).toBe('error');

      flush(); 
    }));

    it('should handle service error during initialization', fakeAsync(() => {
      recommendationService.setError(true);
      
      component.ngOnInit();
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al recibir los documentos recomendados.');
      flush();
    }));

    it('should handle observable error from documents stream', fakeAsync(() => {
      component.ngOnInit();
      
      recommendationService.emitError('Stream error');
      tick();
      
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe('Error al cargar documentos recomendados.');
      flush();
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

    it('should show warning toast', fakeAsync(() => {
      component['showToastMessage']('Warning message', 'warning');
      
      expect(component.toastType).toBe('warning');
      expect(component.toastMessage).toBe('Warning message');
      
      flush();
    }));

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

    it('should not crash when service throws during init', fakeAsync(() => {
      recommendationService.setError(true);
      
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.showToast).toBeTrue();
      flush();
    }));
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
      
       // Simulate service returning data
      recommendationService.setDocuments(mockDocuments);
      
      // Initialize component
      component.ngOnInit();
      
      tick();
      
      // Verify final state
      expect(component.recommendedDocsBack).toEqual(mockDocuments);
      expect(component.showToast).toBeFalse();

      flush();
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

       // Re-initialize component with fresh state
      component.ngOnInit();
      recommendationService.setDocuments(recoveryDocs);
      tick();
      
      expect(component.recommendedDocsBack).toEqual(recoveryDocs);
      
      flush();
    }));
  });

  describe('Component State Management', () => {
    it('should maintain state consistency during multiple operations', fakeAsync(() => {
      // Initial state
      expect(component.recommendedDocsBack).toEqual([]);
      
      // First load
      component.ngOnInit();
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
      flush();
    }));

    it('should preserve hardcoded documents regardless of service state', fakeAsync(() => {
      const originalHardcodedDocs = [...component.recommendedDocs];
      
      // Load from service
      component.ngOnInit();
      recommendationService.setDocuments([]);
      tick();
      
      // Hardcoded docs should remain unchanged
      expect(component.recommendedDocs).toEqual(originalHardcodedDocs);
      
      flush();
    }));
  });

  describe('Document Navigation', () => {
    let mockDocument: DocumentDetail;

    beforeEach(() => {
      mockDocument = {
        id: 'doc-123',
        title: 'Test Document',
        author: 'Test Author',
        publication_date: '2023-01-01',
        knowledge_area: 'Computer Science',
        license: 'MIT',
        repository_uri: 'https://test.com/doc',
        repository_id: 'repo-123',
        status: 'L',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };
    });

    it('should navigate to document view', () => {
      spyOn(documentService, 'setCurrentDocument');
      spyOn(router, 'navigate');
      
      component.openDocument(mockDocument);
      
      expect(documentService.setCurrentDocument).toHaveBeenCalledWith(mockDocument);
      expect(router.navigate).toHaveBeenCalledWith(['/document']);
    });

    it('should handle navigation errors gracefully', () => {
      spyOn(documentService, 'setCurrentDocument').and.throwError('Navigation error');
      spyOn(component as any, 'showToastMessage');
      
      component.openDocument(mockDocument);
      
      expect((component as any).showToastMessage).toHaveBeenCalledWith(
        'No se pudo abrir el documento. Inténtalo de nuevo.'
      );
    });

    it('should show toast message on navigation error', () => {
      spyOn(documentService, 'setCurrentDocument').and.throwError('Test error');
      spyOn(component as any, 'showToastMessage');
      
      component.openDocument(mockDocument);
      
      expect((component as any).showToastMessage).toHaveBeenCalledWith(
        'No se pudo abrir el documento. Inténtalo de nuevo.'
      );
    });

    it('should handle service errors gracefully', () => {
      spyOn(documentService, 'setCurrentDocument').and.throwError('Service error');
      spyOn(console, 'error');
      
      component.openDocument(mockDocument);
      
      expect(console.error).toHaveBeenCalledWith('Error abriendo documento:', jasmine.any(Error));
    });

    it('should work with different document types', () => {
      const documents = [
        { ...mockDocument, status: 'L' as const },
        { ...mockDocument, status: 'R' as const },
        { ...mockDocument, status: 'E' as const }
      ];
      
      spyOn(documentService, 'setCurrentDocument');
      spyOn(router, 'navigate');
      
      documents.forEach(doc => {
        component.openDocument(doc);
        expect(documentService.setCurrentDocument).toHaveBeenCalledWith(doc);
      });
      
      expect(router.navigate).toHaveBeenCalledTimes(3);
    });
  });
});
