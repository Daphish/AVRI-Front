import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';

import { ChatService } from './chat.service';
import { AuthService } from './auth.service';
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

describe('ChatService (Enhanced)', () => {
  let service: ChatService;
  let http: HttpTestingController;
  let docService: MockDocumentService;

  beforeEach(() => {
    docService = new MockDocumentService();
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: DocumentService, useValue: docService },
        { provide: AuthService, useValue: { markProfileAsCompleted: jasmine.createSpy() } },
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
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
  });

  describe('Session Management', () => {
    it('should create new session', (done) => {
      service.createSession('New Chat').subscribe((session) => {
        expect(session.session_name).toBe('New Chat');
        done();
      });

      const post = http.expectOne(req => req.url.endsWith('/api/chat/'));
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toEqual({ session_name: 'New Chat' });
      post.flush({ session_id: 's-new', session_name: 'New Chat' });
    });

    it('should delete session', () => {
      const sessionId = 's-delete';
      service.deleteSession(sessionId);

      const deleteReq = http.expectOne(req => req.url.includes(`/${sessionId}/`));
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({});
    });

    it('should handle delete error gracefully', () => {
      spyOn(console, 'error');
      service.deleteSession('s-error');

      const deleteReq = http.expectOne(req => req.url.includes('s-error'));
      deleteReq.error(new ErrorEvent('Delete failed'));
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Session Reordering', () => {
    it('should reorder sessions when loading messages', (done) => {
      const initialSessions = [
        { session_id: 's-1', session_name: 'First' },
        { session_id: 's-2', session_name: 'Second' }
      ];

      // Load initial sessions
      service.loadSessions();
      const loadReq = http.expectOne(req => req.url.endsWith('/api/chat/'));
      loadReq.flush(initialSessions);

      // Observe session reordering
      service.sessions$.subscribe((sessions) => {
        if (sessions.length === 2 && sessions[0].session_id === 's-2') {
          expect(sessions[0].session_id).toBe('s-2'); // Should be moved to front
          expect(sessions[1].session_id).toBe('s-1');
          done();
        }
      });

      // Load messages from second session
      service.loadMessages('s-2');
      const msgReq = http.expectOne(req => req.url.includes('/s-2/'));
      msgReq.flush({ messages: [] });
    });
  });

  describe('Error Handling', () => {
    it('should handle sendMessage error by removing loading message', (done) => {
      let messageStates: any[][] = [];
      
      const sub = service.messages$.subscribe((messages) => {
        messageStates.push([...messages]);
        // After error, loading message should be removed
        if (messageStates.length >= 3) {
          const finalState = messageStates[messageStates.length - 1];
          const hasLoadingMsg = finalState.some(m => m.isLoading);
          expect(hasLoadingMsg).toBeFalse();
          sub.unsubscribe();
          done();
        }
      });

      service.sendMessage('s-error', 'Test');
      
      const post = http.expectOne(req => req.url.includes('s-error'));
      post.error(new ErrorEvent('Network error'));
    });

    it('should handle malformed message response', (done) => {
      service.messages$.subscribe((messages) => {
        const finalMsg = messages.find(m => !m.fromUser && !m.isLoading);
        if (finalMsg) {
          expect(finalMsg.text).toBe(''); // Should handle missing text gracefully
          done();
        }
      });

      service.sendMessage('s-malformed', 'Test');
      
      const post = http.expectOne(req => req.url.includes('s-malformed'));
      post.flush({ data: {} }); // Malformed response
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple message sends', () => {
      service.sendMessage('s-1', 'Message 1');
      service.sendMessage('s-1', 'Message 2');
      service.sendMessage('s-2', 'Message 3');

      const requests = http.match(req => req.url.includes('/ask'));
      expect(requests.length).toBe(3);

      requests.forEach((req, index) => {
        req.flush({ data: { answer: `Response ${index + 1}` } });
      });
    });
  });

  describe('State Management', () => {
    it('should clear sessions and messages', () => {
      service.clearSessions();
      
      service.sessions$.pipe(take(1)).subscribe((sessions) => {
        expect(sessions).toEqual([]);
      });
      
      service.messages$.pipe(take(1)).subscribe((messages) => {
        expect(messages).toEqual([]);
      });
    });

    it('should maintain wizard state', () => {
      expect(service.pendingWizard).toBeFalse();
      service.pendingWizard = true;
      expect(service.pendingWizard).toBeTrue();
    });
  });
});
