import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

function setToken(value: string | null) {
  const keys = ['authToken', 'token'];
  for (const k of keys) {
    if (value === null) localStorage.removeItem(k);
    else localStorage.setItem(k, value);
  }
}

describe('AuthService (aligned with project code)', () => {
  let service: AuthService;
  let http: HttpTestingController;

  afterEach(() => localStorage.clear());

  const matchMe = (u: string) => /\/api\/user\/me\/?$/.test(u);
  const matchToken = (u: string) => /\/api\/(user\/)?token\/?$/.test(u);
  const matchCreateAnon = (u: string) => /\/api\/(user\/)?create-anonymous\/?$/.test(u);
  const matchTokenAnon = (u: string) => /\/api\/(user\/)?token-anonymous\/?$/.test(u);
  const matchProfileMe = (u: string) => /\/api\/recommender\/profile\/me\/?$/.test(u);

  describe('browser platform', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(withFetch()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(AuthService);
      http = TestBed.inject(HttpTestingController);
    });

    it('autoLogin(): token present → /me → (non-anon) /recommender/profile/me', async () => {
      setToken('tkn-123');

      const p = service.autoLogin(); 
      await new Promise(resolve => setTimeout(resolve, 0)); // Let async start

      const me = http.expectOne(req => matchMe(req.url));
      expect(me.request.method).toBe('GET');
      me.flush({ id: 1, email: 'alice@example.com' } as any);

      await new Promise(resolve => setTimeout(resolve, 0)); // Let next request start

      const prof = http.expectOne(req => matchProfileMe(req.url));
      expect(prof.request.method).toBe('GET');
      prof.flush({ profile: null });

      await p;
      expect(true).toBeTrue(); 
      http.verify();
    });

    it('login(): /user/token → /me → /recommender/profile/me → returns true', async () => {
      const loginPromise = service.login('alice@example.com', 'secret');
      await new Promise(resolve => setTimeout(resolve, 0)); // Let async start

      const tokenReq = http.expectOne(r => matchToken(r.url));
      expect(tokenReq.request.method).toBe('POST');
      tokenReq.flush({ token: 'tkn-login' });

      await new Promise(resolve => setTimeout(resolve, 0)); // Let next request start

      const meReq = http.expectOne(r => matchMe(r.url));
      meReq.flush({ id: 7, email: 'alice@example.com' } as any);

      await new Promise(resolve => setTimeout(resolve, 0)); // Let next request start

      const prof = http.expectOne(r => matchProfileMe(r.url));
      prof.flush({ profile: null });

      const ok = await loginPromise;
      expect(ok).toBeTrue();
      expect(localStorage.getItem('authToken') || localStorage.getItem('token')).toBe('tkn-login');
      http.verify();
    });

    it('createAnonymous(): create-anonymous → token-anonymous → /me (with anonymous_id) — no profile call', async () => {
      const anonPromise = service.createAnonymous();
      await new Promise(resolve => setTimeout(resolve, 0)); // Let async start

      const createAnon = http.expectOne(r => matchCreateAnon(r.url));
      expect(createAnon.request.method).toBe('POST');
      createAnon.flush({ anonymous_id: 'anon-001' });

      await new Promise(resolve => setTimeout(resolve, 0)); // Let next request start

      const tokenAnon = http.expectOne(r => matchTokenAnon(r.url));
      expect(tokenAnon.request.method).toBe('POST');
      tokenAnon.flush({ token: 'tkn-anon' });

      await new Promise(resolve => setTimeout(resolve, 0)); // Let next request start

      const me = http.expectOne(r => matchMe(r.url));
      me.flush({ id: 'u-anon', anonymous_id: 'anon-001' } as any);

      http.expectNone(r => matchProfileMe(r.url)); 

      const ok = await anonPromise;
      expect(ok).toBeTrue();
      expect(localStorage.getItem('authToken') || localStorage.getItem('token')).toBe('tkn-anon');
      http.verify();
    });

    it('logout() clears tokens', () => {
      localStorage.setItem('authToken', 'tkn-x');
      service.logout();
      expect(localStorage.getItem('authToken')).toBeNull();
      // Note: logout only clears 'authToken', not 'token'
      http.verify();
    });
  });

  describe('server platform (SSR)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(withFetch()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      service = TestBed.inject(AuthService);
      http = TestBed.inject(HttpTestingController);
    });

    it('autoLogin() does nothing on SSR', async () => {
      setToken('tkn-123');
      const p = service.autoLogin();
      http.expectNone(() => true);
      await p;
      expect(true).toBeTrue();
      http.verify();
    });
  });
});
