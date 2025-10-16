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
    
    service.documents$.subscribe((docs) => {
      finalDocs = docs;
    });

    service.getDetailedDocuments();

    // First request: get document IDs
    const idsReq = http.expectOne(req => /\/api\/recommender\/serve\/?$/.test(req.url));
    expect(idsReq.request.method).toBe('GET');
    idsReq.flush([{ id: 'a' }, { id: 'b' }, { id: 'c' }]); // Returns Document objects with IDs
    
    tick(); // Allow observables to process the IDs
    
    // Second: DocumentService.getDocumentsByIds makes requests to /api/documents/{id}/repository
    const detailReqs = http.match(req => /\/api\/documents\/(a|b|c)\/repository/.test(req.url));
    expect(detailReqs.length).toBe(3); // Ensure all 3 detail requests were made
    
    detailReqs.forEach((req) => {
      const id = req.request.url.match(/\/api\/documents\/(\w+)\/repository/)?.[1];
      req.flush({ id, title: `Document ${id}`, details: 'Some details' });
    });
    
    tick(); // Allow observables to complete

    expect(finalDocs.length).toBe(3);
    expect(finalDocs.map(d => d.id)).toEqual(['a', 'b', 'c']);
    
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
