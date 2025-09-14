import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor (starter suite)', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => localStorage.clear());

  it('adds Authorization: Token <token> when token exists', () => {
    localStorage.setItem('authToken', 'abc123');
    client.get('/api/ping').subscribe();
    const req = http.expectOne(r => r.url.endsWith('/api/ping'));
    expect(req.request.headers.get('Authorization')).toBe('Token abc123');
    req.flush({ ok: true });
    http.verify();
  });

  it('does not add header when no token', () => {
    client.get('/api/ping').subscribe();
    const req = http.expectOne(r => r.url.endsWith('/api/ping'));
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
    http.verify();
  });

  it('does not break calls to auth endpoints', () => {
    client.post('/api/user/token/', { email: 'a', password: 'b' }).subscribe();
    const req = http.expectOne(r => /\/api\/(user\/)?token\/?$/.test(r.url));
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'xyz' });
    http.verify();
  });
});
