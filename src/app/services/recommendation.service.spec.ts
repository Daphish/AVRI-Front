import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { RecommendationService } from './recommendation.service';
import { DocumentService, DocumentDetail } from './document.service';

class MockDocumentService {
  getDocumentsByIds(ids: string[]) {
    const unique = Array.from(new Set(ids));
    const docs = unique.map((id) => ({ id, title: `T-${id}`, repository_uri: `https://repo/${id}` } as DocumentDetail));
    return of(docs);
  }
}

describe('RecommendationService', () => {
  let service: RecommendationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecommendationService,
        { provide: DocumentService, useClass: MockDocumentService },
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RecommendationService);
    http = TestBed.inject(HttpTestingController);
  });

  it('getDetailedDocuments(): waits for final list (length===3) before asserting', fakeAsync(() => {
    let finalDocs: any[] = [];
    
    // Subscribe before calling the method
    const sub = service.documents$.subscribe((docs) => {
      finalDocs = docs;
    });

    service.getDetailedDocuments();
    tick(); // Let the method start

    // First request: get document IDs from recommender
    const idsReq = http.expectOne('/api/recommender/serve/');
    expect(idsReq.request.method).toBe('GET');
    idsReq.flush([{ id: 'a' }, { id: 'b' }, { id: 'c' }]); // Returns Document objects with IDs
    
    tick(); // Process the response and trigger getDocumentsByIds
    
    // Second: DocumentService.getDocumentsByIds makes forkJoin of requests
    const reqA = http.expectOne('/api/documents/a/repository');
    const reqB = http.expectOne('/api/documents/b/repository');
    const reqC = http.expectOne('/api/documents/c/repository');
    
    reqA.flush({ id: 'a', title: 'Document a', author: 'Author A' });
    reqB.flush({ id: 'b', title: 'Document b', author: 'Author B' });
    reqC.flush({ id: 'c', title: 'Document c', author: 'Author C' });
    
    tick(); // Process all responses and update documents$$

    expect(finalDocs.length).toBe(3);
    expect(finalDocs.map(d => d.id)).toEqual(['a', 'b', 'c']);
    
    sub.unsubscribe();
    http.verify();
  }));

  it('getDocuments() returns [] on server error (smoke)', (done) => {
    service.getDocuments().subscribe((raw: any[]) => {
      expect(raw).toEqual([]);
      done();
    });

    const req = http.expectOne(r => /\/api\/recommender\/serve\/?$/.test(r.url));
    req.flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });

    http.verify();
  });
});
