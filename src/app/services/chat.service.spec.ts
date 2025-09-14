import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ChatService } from './chat.service';
import { DocumentService, DocumentDetail } from './document.service';

class MockDocumentService {
  calls: string[][] = [];
  getDocumentsByIds(ids: string[]) {
    this.calls.push(ids);
    const unique = Array.from(new Set(ids));
    const docs = unique.map(id => ({ id, title: `Doc ${id}`, repository_uri: `https://repo/${id}` } as DocumentDetail));
    return of(docs);
  }
}

describe('ChatService (aligned with sendMessage)', () => {
  let service: ChatService;
  let http: HttpTestingController;
  let docService: MockDocumentService;

  beforeEach(() => {
    docService = new MockDocumentService();
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: DocumentService, useValue: docService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  it('sendMessage(): posts to /ask/, de-dupes doc IDs, publishes final reply', (done) => {
    const sessionId = 's-1';

    const sub = service.messages$.subscribe((arr: any[]) => {
      const final = arr.find(m => !m.fromUser && !m.isLoading);
      if (final) {
        expect((final.text || '').trim()).toBe('The answer.');
        expect(final.references?.length).toBe(2);
        expect(docService.calls[0]).toEqual(['d1', 'd2']);
        sub.unsubscribe();
        done();
      }
    });

    service.sendMessage(sessionId, 'What is RAG?');

    const post = http.expectOne(req => req.url.endsWith(`/api/chat/${sessionId}/ask/`) || req.url.endsWith(`/api/chat/${sessionId}/ask`));
    expect(post.request.method).toBe('POST');

    const raw = {
      data: {
        answer: 'The answer.',
        reference: {
          chunks: [
            { document_id: 'd1' },
            { document_id: 'd2' },
            { document_id: 'd1' },
          ],
        },
      },
    };

    post.flush(raw);
    http.verify();
  });

  it('loadSessions(): populates sessions$ from /chat/', (done) => {
    const sub = service.sessions$.subscribe((list: any[]) => {
      if (list.length) {
        const first = list[0] as any;
        expect(typeof first.session_name).toBe('string');
        const idLike = first.session_id ?? first.id ?? first.idChat ?? first.uuid;
        expect(idLike).toBeDefined();
        sub.unsubscribe();
        done();
      }
    });

    (service as any).loadSessions(); 

    const get = http.expectOne(req => req.url.endsWith('/api/chat/') || req.url.endsWith('/api/chat'));
    expect(get.request.method).toBe('GET');
    get.flush([{ session_id: 's-1', session_name: 'Default' }]);

    http.verify();
  });
});
