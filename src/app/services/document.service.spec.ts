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

    http.verify();
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

    http.verify();
  });
});
