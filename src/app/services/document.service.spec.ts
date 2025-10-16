import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { DocumentService, DocumentDetail, SavedDocument, AuthoredDocument } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let http: HttpTestingController;

  const mockDocument: DocumentDetail = {
    id: 'doc-123',
    title: 'Test Document',
    author: 'Test Author',
    publication_date: '2024-01-01',
    knowledge_area: 'Computer Science',
    license: 'MIT',
    repository_uri: 'https://example.com/doc',
    repository_id: 'repo-123',
    status: 'L',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService, provideHttpClient(withFetch()), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });


  it('getDocumentsByIds() preserves order and does NOT dedupe internally', (done) => {
    const ids = ['doc-1', 'doc-2', 'doc-1'];

    service.getDocumentsByIds(ids).subscribe(docs => {
      expect(docs.map(d => d.id)).toEqual(['doc-1', 'doc-2', 'doc-1']);
      done();
    });

    const reqs = http.match(req => req.url.includes('/api/documents/') && req.url.includes('/repository'));
    expect(reqs.length).toBe(3); // one per id

    reqs.forEach(r => {
      const id = r.request.url.match(/documents\/([^/]+)/)?.[1]!;
      r.flush({ id, title: id.toUpperCase(), repository_uri: `https://x/${id}` } as DocumentDetail);
    });
  });

  it('loadDocument() updates document$ after HTTP resolves', (done) => {
    const sub = service.document$.subscribe((d: any) => {
      if (d?.id === 'doc-9') {
        expect(d.title).toBe('NINTH');
        sub.unsubscribe();
        done();
      }
    });

    service.loadDocument('doc-9').subscribe();

    const r = http.expectOne(req =>
      req.url.includes('/api/documents/') &&
      req.url.includes('/doc-9') &&
      req.url.includes('/repository')
    );
    expect(r.request.method).toBe('GET');
    r.flush({ id: 'doc-9', title: 'NINTH', repository_uri: 'https://x/9' } as DocumentDetail);
  });

  describe('setCurrentDocument()', () => {
    it('should set current document ID and detail in BehaviorSubjects', (done) => {
      let idReceived = false;
      let docReceived = false;

      service.currentDocumentId$.subscribe(id => {
        if (id === 'doc-123') {
          expect(id).toBe('doc-123');
          idReceived = true;
          if (docReceived) done();
        }
      });

      service.document$.subscribe(doc => {
        if (doc?.id === 'doc-123') {
          expect(doc).toEqual(mockDocument);
          expect(doc.title).toBe('Test Document');
          docReceived = true;
          if (idReceived) done();
        }
      });

      service.setCurrentDocument(mockDocument);
    });

    it('should update observables when called multiple times', (done) => {
      const doc1: DocumentDetail = { ...mockDocument, id: 'doc-1', title: 'Doc 1' };
      const doc2: DocumentDetail = { ...mockDocument, id: 'doc-2', title: 'Doc 2' };

      let callCount = 0;
      
      service.currentDocumentId$.subscribe(id => {
        if (id === 'doc-1') {
          callCount++;
          expect(id).toBe('doc-1');
        } else if (id === 'doc-2') {
          callCount++;
          expect(id).toBe('doc-2');
          if (callCount === 2) done();
        }
      });

      service.setCurrentDocument(doc1);
      service.setCurrentDocument(doc2);
    });
  });

  describe('saveDocument()', () => {
    it('should POST to /api/documents/saved/add/{id}/', () => {
      const docId = 'doc-456';
      const mockResponse: SavedDocument = {
        id: 'saved-1',
        document: mockDocument
      };

      service.saveDocument(docId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe('saved-1');
      });

      const req = http.expectOne('/api/documents/saved/add/doc-456/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle saveDocument error', () => {
      const docId = 'doc-error';

      service.saveDocument(docId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = http.expectOne('/api/documents/saved/add/doc-error/');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('removeSaved()', () => {
    it('should DELETE to /api/documents/saved/delete/{id}/', () => {
      const docId = 'doc-789';

      service.removeSaved(docId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = http.expectOne('/api/documents/saved/delete/doc-789/');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle removeSaved error', () => {
      const docId = 'doc-error';

      service.removeSaved(docId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = http.expectOne('/api/documents/saved/delete/doc-error/');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getSavedDocuments()', () => {
    it('should GET list of saved documents', () => {
      const mockSavedDocs: SavedDocument[] = [
        { id: 'saved-1', document: mockDocument },
        { id: 'saved-2', document: { ...mockDocument, id: 'doc-2' } }
      ];

      service.getSavedDocuments().subscribe(docs => {
        expect(docs.length).toBe(2);
        expect(docs).toEqual(mockSavedDocs);
      });

      const req = http.expectOne('/api/documents/saved/list/');
      expect(req.request.method).toBe('GET');
      req.flush(mockSavedDocs);
    });

    it('should handle empty saved documents list', () => {
      service.getSavedDocuments().subscribe(docs => {
        expect(docs).toEqual([]);
      });

      const req = http.expectOne('/api/documents/saved/list/');
      req.flush([]);
    });

    it('should handle getSavedDocuments error', () => {
      service.getSavedDocuments().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = http.expectOne('/api/documents/saved/list/');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('claimDocument()', () => {
    it('should POST to /api/documents/authored/add/{id}/', () => {
      const docId = 'doc-claim';
      const mockAuthored: AuthoredDocument = {
        id: 'authored-1',
        document: mockDocument
      };

      service.claimDocument(docId).subscribe(response => {
        expect(response).toEqual(mockAuthored);
        expect(response.id).toBe('authored-1');
      });

      const req = http.expectOne('/api/documents/authored/add/doc-claim/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockAuthored);
    });

    it('should handle claimDocument error', () => {
      const docId = 'doc-error';

      service.claimDocument(docId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = http.expectOne('/api/documents/authored/add/doc-error/');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('unclaimDocument()', () => {
    it('should DELETE to /api/documents/authored/delete/{id}/', () => {
      const docId = 'doc-unclaim';

      service.unclaimDocument(docId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = http.expectOne('/api/documents/authored/delete/doc-unclaim/');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle unclaimDocument error', () => {
      const docId = 'doc-error';

      service.unclaimDocument(docId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = http.expectOne('/api/documents/authored/delete/doc-error/');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('clear()', () => {
    it('should reset currentId and detail to null', (done) => {
      service.setCurrentDocument(mockDocument);

      // Verify that it has a value before clearing it
      expect(service.currentDocument).not.toBeNull();

      service.clear();

      // Verify that both observables emit null
      let idChecked = false;
      let docChecked = false;

      service.currentDocumentId$.subscribe(id => {
        expect(id).toBeNull();
        idChecked = true;
        if (docChecked) done();
      });

      service.document$.subscribe(doc => {
        expect(doc).toBeNull();
        docChecked = true;
        if (idChecked) done();
      });
    });

    it('should be safe to call clear() multiple times', (done) => {
      service.setCurrentDocument(mockDocument);
      
      expect(() => {
        service.clear();
        service.clear();
        service.clear();
      }).not.toThrow();

      service.currentDocumentId$.subscribe(id => {
        expect(id).toBeNull();
        done();
      });
    });

    it('should clear even if no document was set', (done) => {
      expect(() => service.clear()).not.toThrow();

      service.currentDocumentId$.subscribe(id => {
        expect(id).toBeNull();
        done();
      });
    });
  });

  describe('currentDocument getter', () => {
    it('should return the current document value', () => {
      expect(service.currentDocument).toBeNull();

      service.setCurrentDocument(mockDocument);
      expect(service.currentDocument).toEqual(mockDocument);
      expect(service.currentDocument?.id).toBe('doc-123');
    });

    it('should return null after clear()', () => {
      service.setCurrentDocument(mockDocument);
      expect(service.currentDocument).not.toBeNull();

      service.clear();
      expect(service.currentDocument).toBeNull();
    });

    it('should return the latest document after multiple sets', () => {
      const doc1: DocumentDetail = { ...mockDocument, id: 'doc-1' };
      const doc2: DocumentDetail = { ...mockDocument, id: 'doc-2' };

      service.setCurrentDocument(doc1);
      expect(service.currentDocument?.id).toBe('doc-1');

      service.setCurrentDocument(doc2);
      expect(service.currentDocument?.id).toBe('doc-2');
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end: set, get, clear', (done) => {
      service.setCurrentDocument(mockDocument);
      expect(service.currentDocument?.title).toBe('Test Document');

      service.document$.subscribe(doc => {
        if (doc?.id === 'doc-123') {
          expect(doc.id).toBe('doc-123');
          
          service.clear();
          expect(service.currentDocument).toBeNull();
          done();
        }
      });
    });

    it('should handle save -> remove workflow', () => {
      const docId = 'workflow-doc';

      service.saveDocument(docId).subscribe();
      const saveReq = http.expectOne('/api/documents/saved/add/workflow-doc/');
      saveReq.flush({ id: 'saved-1', document: mockDocument });

      service.removeSaved(docId).subscribe();
      const removeReq = http.expectOne('/api/documents/saved/delete/workflow-doc/');
      removeReq.flush(null);
    });

    it('should handle claim -> unclaim workflow', () => {
      const docId = 'authored-doc';

      service.claimDocument(docId).subscribe();
      const claimReq = http.expectOne('/api/documents/authored/add/authored-doc/');
      claimReq.flush({ id: 'authored-1', document: mockDocument });

      service.unclaimDocument(docId).subscribe();
      const unclaimReq = http.expectOne('/api/documents/authored/delete/authored-doc/');
      unclaimReq.flush(null);
    });
  });
});