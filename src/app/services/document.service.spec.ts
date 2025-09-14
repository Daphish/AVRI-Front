import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { DocumentService, DocumentDetail } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentService);
    http = TestBed.inject(HttpTestingController);
  });

  it('getDocumentsByIds() fetches once per unique id and preserves order', (done) => {
    const ids = ['doc-1', 'doc-2', 'doc-1'];

    service.getDocumentsByIds(ids).subscribe(docs => {
      expect(docs.map(d => d.id)).toEqual(['doc-1', 'doc-2']);
      done();
    });

    const reqs = http.match(req => req.url.includes('/api/documents/') && req.url.includes('/repository'));
    expect(reqs.length).toBe(2);

    for (const r of reqs) {
      if (r.request.url.includes('doc-1')) {
        r.flush({ id: 'doc-1', title: 'One', repository_uri: 'https://x/1' } as DocumentDetail);
      } else if (r.request.url.includes('doc-2')) {
        r.flush({ id: 'doc-2', title: 'Two', repository_uri: 'https://x/2' } as DocumentDetail);
      }
    }

    http.verify();
  });

  it('loadDocument() updates document$ after HTTP resolves', (done) => {
    const sub = service.document$.subscribe((d: any) => {
      if (d?.id === 'doc-9') {
        expect(d.title).toBe('Ninth');
        sub.unsubscribe();
        done();
      }
    });

    service.loadDocument('doc-9').subscribe();

    const r = http.expectOne(req => req.url.includes('/api/documents/') && req.url.includes('/doc-9') && req.url.includes('/repository'));
    expect(r.request.method).toBe('GET');
    r.flush({ id: 'doc-9', title: 'Ninth', repository_uri: 'https://x/9' } as DocumentDetail);

    http.verify();
  });
});
