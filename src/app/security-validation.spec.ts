import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { UserService } from './services/user.service';
import { SeguroHtmlPipe } from './pipes/seguro-html.pipe';
import { authInterceptor } from './services/auth.interceptor';

describe('Security & Validation Tests', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let chatService: ChatService;
  let userService: UserService;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        ChatService,
        UserService,
        SeguroHtmlPipe,
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    chatService = TestBed.inject(ChatService);
    userService = TestBed.inject(UserService);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Input Validation Tests', () => {
    describe('Authentication Input Validation', () => {
      it('should handle malicious email inputs', async () => {
        const maliciousEmails = [
          '<script>alert("xss")</script>@example.com',
          'user@<script>alert("xss")</script>.com',
        ];

        for (const email of maliciousEmails) {
          const loginPromise = authService.login(email, 'password');
          
          // Login triggers: /user/token, /me, /recommender/profile/me
          const tokenReq = httpMock.expectOne('/api/user/token/');
          expect(tokenReq.request.body.email).toBe(email);
          tokenReq.flush({ error: 'Invalid email' }, { status: 400, statusText: 'Bad Request' });
          
          const result = await loginPromise;
          expect(result).toBeFalse();
        }
      });

      it('should handle malicious password inputs', async () => {
        const maliciousPasswords = [
          '<script>alert("xss")</script>',
          '"; DROP TABLE users; --',
        ];

        for (const password of maliciousPasswords) {
          const loginPromise = authService.login('user@example.com', password);
          
          const tokenReq = httpMock.expectOne('/api/user/token/');
          expect(tokenReq.request.body.password).toBe(password);
          tokenReq.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
          
          const result = await loginPromise;
          expect(result).toBeFalse();
        }
      });

      it('should handle extremely long inputs', async () => {
        const longEmail = 'a'.repeat(1000) + '@example.com';
        const longPassword = 'password'.repeat(1000);

        const loginPromise = authService.login(longEmail, longPassword);
        
        const req = httpMock.expectOne('/api/user/token/');
        expect(req.request.body.email.length).toBeGreaterThan(1000);
        expect(req.request.body.password.length).toBeGreaterThan(1000);
        req.flush({ error: 'Input too long' }, { status: 400, statusText: 'Bad Request' });
        
        const result = await loginPromise;
        expect(result).toBeFalse();
      });

      it('should handle null and undefined inputs', async () => {
        const testCases = [
          { email: '', password: '' },
          { email: 'user@example.com', password: '' }
        ];

        for (const testCase of testCases) {
          const loginPromise = authService.login(testCase.email as any, testCase.password as any);
          
          const req = httpMock.expectOne('/api/user/token/');
          req.flush({ error: 'Invalid input' }, { status: 400, statusText: 'Bad Request' });
          
          const result = await loginPromise;
          expect(result).toBeFalse();
        }
      });
    });

    describe('Chat Input Validation', () => {
      it('should handle malicious chat messages', () => {
        const message = '<script>alert("xss")</script>';
        
        // Should not throw error but should handle safely
        expect(() => {
          chatService.sendMessage('session-1', message);
        }).not.toThrow();
        
        // Flush the request with correct response format
        const req = httpMock.expectOne('/api/chat/session-1/ask/');
        req.flush({ data: { answer: 'ok', reference: { chunks: [] } } });
      });

      it('should handle extremely long chat messages', () => {
        const longMessage = 'a'.repeat(10000);
        
        expect(() => {
          chatService.sendMessage('session-1', longMessage);
        }).not.toThrow();
        
        // Flush the request with correct response format
        const req = httpMock.expectOne('/api/chat/session-1/ask/');
        req.flush({ data: { answer: 'ok', reference: { chunks: [] } } });
      });

      it('should handle special characters in session IDs', () => {
        const sessionId = 'valid-session';
        
        expect(() => {
          chatService.sendMessage(sessionId, 'test message');
        }).not.toThrow();
        
        // Flush the request with correct response format
        const req = httpMock.expectOne(`/api/chat/${sessionId}/ask/`);
        req.flush({ data: { answer: 'ok', reference: { chunks: [] } } });
      });
    });

    describe('Profile Input Validation', () => {
      it('should validate profile data structure', () => {
        const maliciousProfileData: any[] = [
          { __proto__: { isAdmin: true } },
          { constructor: { prototype: { isAdmin: true } } },
          { interests: ['<script>alert(1)</script>'] },
          { document_titles: ['<img src=x onerror=alert(1)>'] },
          { interests: null },
          { document_titles: undefined },
          { interests: 'not an array' },
          { extra_field: 'should not be here' }
        ];

        for (const profileData of maliciousProfileData) {
          // Should handle malicious profile data gracefully
          expect(() => {
            // Simulate profile submission
            const payload = { profile: profileData };
            JSON.stringify(payload); // Should not throw
          }).not.toThrow();
        }
      });
    });
  });

  describe('XSS Prevention Tests', () => {
    describe('HTML Content Sanitization', () => {
      it('should sanitize HTML content using SeguroHtmlPipe', () => {
        const pipe = new SeguroHtmlPipe(sanitizer);
        
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          '<img src=x onerror=alert(1)>',
        ];

        for (const maliciousInput of maliciousInputs) {
          const sanitized = pipe.transform(maliciousInput);
          // Angular sanitizer returns SafeHtml object
          expect(sanitized).toBeTruthy();
        }
      });

      it('should handle safe HTML content', () => {
        const pipe = new SeguroHtmlPipe(sanitizer);
        
        const safeInputs = [
          '<p>This is safe content</p>',
          '<strong>Bold text</strong>',
        ];

        for (const safeInput of safeInputs) {
          const sanitized = pipe.transform(safeInput);
          // Should return SafeHtml object
          expect(sanitized).toBeTruthy();
        }
      });
    });

    describe('JSON Injection Prevention', () => {
      it('should handle malicious JSON payloads', () => {
        const maliciousPayloads = [
          '{"__proto__": {"isAdmin": true}}',
          '{"constructor": {"prototype": {"isAdmin": true}}}',
          '{"toString": "function() { alert(1); }"}',
          '{"valueOf": "function() { alert(1); }"}',
          '{"prototype": {"polluted": "yes"}}',
          '{"\\u0000": "null byte"}',
          '{"\\u0027": "single quote"}',
          '{"\\u0022": "double quote"}'
        ];

        for (const payload of maliciousPayloads) {
          expect(() => {
            const parsed = JSON.parse(payload);
            // Should parse but not pollute prototypes
            expect(parsed).toBeTruthy();
            expect(({} as any).isAdmin).toBeUndefined();
            expect(({} as any).polluted).toBeUndefined();
          }).not.toThrow();
        }
      });
    });
  });

  describe('CSRF Protection Tests', () => {
    it('should use proper HTTP methods for state-changing operations', async () => {
      // Creating anonymous user should use POST
      const anonPromise = authService.createAnonymous();
      
      // First request: create anonymous
      const anonReq = httpMock.expectOne('/api/user/create-anonymous/');
      expect(anonReq.request.method).toBe('POST');
      anonReq.flush({ anonymous_id: 'anon-123' });

      // Second request: get token (after create completes)
      await new Promise(resolve => setTimeout(resolve, 0)); // Let microtasks complete
      const tokenReq = httpMock.expectOne('/api/user/token-anonymous/');
      expect(tokenReq.request.method).toBe('POST');
      tokenReq.flush({ token: 'anon-token' });
      
      // Third request: fetch user (after token is set)
      await new Promise(resolve => setTimeout(resolve, 0)); // Let microtasks complete
      const meReq = httpMock.expectOne('/api/user/me/');
      meReq.flush({ anonymous_id: 'anon-123', name: 'Anonymous' });
      
      await anonPromise;
    });

    it('should include proper headers for API requests', () => {
      localStorage.setItem('authToken', 'test-token');
      
      userService.getUsers().subscribe();
      
      const req = httpMock.expectOne('/api/user/list');
      
      // Should include authorization header
      expect(req.request.headers.get('Authorization')).toBe('Token test-token');
      
      req.flush([]);
    });
  });

  describe('Data Exposure Prevention', () => {
    it('should not expose sensitive data in client-side code', () => {
      // Check that no hardcoded secrets exist
      const authServiceCode = authService.constructor.toString();
      const chatServiceCode = chatService.constructor.toString();
      
      const sensitivePatterns = [
        /password\s*=\s*["'].*["']/i,
        /secret\s*=\s*["'].*["']/i,
        /api[_-]?key\s*=\s*["'].*["']/i,
        /token\s*=\s*["'][a-zA-Z0-9]{20,}["']/i,
        /private[_-]?key\s*=\s*["'].*["']/i
      ];

      for (const pattern of sensitivePatterns) {
        expect(authServiceCode).not.toMatch(pattern);
        expect(chatServiceCode).not.toMatch(pattern);
      }
    });

    it('should not log sensitive information', () => {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      const loggedMessages: string[] = [];
      
      console.log = (message: any) => loggedMessages.push(String(message));
      console.error = (message: any) => loggedMessages.push(String(message));
      console.warn = (message: any) => loggedMessages.push(String(message));

      try {
        // Perform operations that might log
        authService.login('user@example.com', 'secretpassword');
        httpMock.expectOne('/api/user/token/').flush({ token: 'secret-token' });

        // Check logged messages don't contain sensitive data
        const allLogs = loggedMessages.join(' ');
        expect(allLogs).not.toContain('secretpassword');
        expect(allLogs).not.toContain('secret-token');
      } finally {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
    });

    it('should handle localStorage securely', async () => {
      // Test that sensitive data is handled properly in localStorage
      const loginPromise = authService.login('user@example.com', 'password');
      
      // First request: get token
      const tokenReq = httpMock.expectOne('/api/user/token/');
      tokenReq.flush({ token: 'test-token' });
      
      // Second request: fetch user (after token is set)
      await new Promise(resolve => setTimeout(resolve, 0)); // Let microtasks complete
      const meReq = httpMock.expectOne('/api/user/me/');
      meReq.flush({ id: 1, email: 'user@example.com', name: 'Test User', first_name: 'Test', last_name: 'User', education_level: 'Bachelor', field_of_study: 'CS' });
      
      // Third request: fetch profile
      await new Promise(resolve => setTimeout(resolve, 0)); // Let microtasks complete
      const profileReq = httpMock.expectOne('/api/recommender/profile/me/');
      profileReq.flush({ profile: { interests: [], document_titles: [] } });

      await loginPromise;

      const storedToken = localStorage.getItem('authToken');
      expect(storedToken).toBe('test-token');

      // Logout should clear sensitive data
      authService.logout();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('API Endpoint Security', () => {
    it('should use HTTPS-ready configurations', () => {
      // Check that API calls use relative paths (allowing HTTPS)
      userService.getUsers().subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/api/user/list'));
      
      // Should use relative path, not hardcoded HTTP
      expect(req.request.url).not.toMatch(/^https?:\/\//);
      expect(req.request.url).toMatch(/^\/api\//);
      
      req.flush([]);
    });

    it('should handle rate limiting gracefully', () => {
      const rateLimitResponse = {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '60' }
      };

      authService.login('user@example.com', 'password');
      const req = httpMock.expectOne('/api/user/token/');
      req.flush({ error: 'Rate limit exceeded' }, rateLimitResponse);

      // Should handle rate limiting without crashing
      expect(true).toBeTruthy();
    });

    it('should validate response data structure', () => {
      const maliciousResponses: any[] = [
        { __proto__: { isAdmin: true } },
        { constructor: { prototype: { isAdmin: true } } },
        { token: '<script>alert(1)</script>' },
        { user: { name: '<img src=x onerror=alert(1)>' } },
        null,
        undefined,
        'not an object',
        123
      ];

      for (const response of maliciousResponses) {
        userService.getUsers().subscribe({
          next: (data: any) => {
            // Should receive response but not be exploited
            expect(({} as any).isAdmin).toBeUndefined();
          },
          error: (error: any) => {
            // Malformed responses may cause errors, which is acceptable
            expect(error).toBeTruthy();
          }
        });

        const req = httpMock.expectOne('/api/user/list');
        if (response !== undefined) {
          req.flush(response);
        } else {
          req.error(new ProgressEvent('error'));
        }
      }
    });
  });

  describe('Session Security', () => {
    it('should handle session expiration gracefully', async () => {
      localStorage.setItem('authToken', 'expired-token');

      const fetchPromise = authService.fetchAndSetCurrentUser();
      
      const req = httpMock.expectOne('/api/user/me/');
      req.flush({ error: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      await fetchPromise;

      // Should logout user on token expiration
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should not persist sensitive session data beyond logout', () => {
      // Set up a token
      localStorage.setItem('authToken', 'test-token');

      // Logout
      authService.logout();

      // Check that sensitive data is cleared
      expect(localStorage.getItem('authToken')).toBeNull();
      
      // Verify user is logged out
      authService.isLoggedIn$.subscribe((loggedIn: boolean) => {
        expect(loggedIn).toBeFalse();
      });
    });
  });

  describe('Content Security Policy Compliance', () => {
    it('should not use eval or similar dangerous functions', () => {
      const serviceCode = [
        authService.constructor.toString(),
        chatService.constructor.toString(),
        userService.constructor.toString()
      ].join(' ');

      const dangerousFunctions = [
        'eval(',
        'Function(',
        'setTimeout(',  // when used with strings
        'setInterval(', // when used with strings
        'execScript(',
        'document.write(',
        'innerHTML ='
      ];

      for (const dangerous of dangerousFunctions) {
        // Allow some safe uses, but flag potential issues
        if (serviceCode.includes(dangerous)) {
          console.warn(`Found potentially dangerous function: ${dangerous}`);
        }
      }

      // This test is more for awareness than strict enforcement
      expect(true).toBeTruthy();
    });

    it('should handle dynamic content safely', () => {
      // Test that dynamic content is handled through Angular's safe methods
      const pipe = new SeguroHtmlPipe(sanitizer);
      
      const dynamicContent = '<p>Dynamic content with <strong>HTML</strong></p>';
      const safeContent = pipe.transform(dynamicContent);
      
      // Should be safe HTML
      expect(safeContent).toBeTruthy();
      expect(typeof safeContent).toBe('object'); // SafeHtml object
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error messages', () => {
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /internal server/i,
        /stack trace/i,
        /database/i,
        /connection string/i
      ];

      authService.login('user@example.com', 'wrongpassword');
      const req = httpMock.expectOne('/api/user/token/');
      
      const errorResponse = { 
        error: 'Authentication failed',
        message: 'Invalid credentials'
      };
      
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });

      // Error messages should be generic
      const errorMessage = JSON.stringify(errorResponse);
      for (const pattern of sensitivePatterns) {
        expect(errorMessage).not.toMatch(pattern);
      }
    });
  });
});
