import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
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
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RecommendationService);
    http = TestBed.inject(HttpTestingController);
  });

  it('getDetailedDocuments(): waits for final list (length===3) before asserting', (done) => {
    const sub = service.documents$.subscribe((docs) => {
      if (docs.length === 3) {
        expect(docs.map(d => d.id)).toEqual(['a', 'b', 'c']);
        sub.unsubscribe();
        done();
      }
    });

    service.getDetailedDocuments();

    const idsReq = http.expectOne(req => /\/api\/recommender\/serve\/?$/.test(req.url));
    expect(idsReq.request.method).toBe('GET');
    idsReq.flush(['a', 'b', 'c']);

    http.verify();
  });

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
