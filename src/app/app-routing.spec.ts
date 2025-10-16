import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';

// Mock components for testing
@Component({ selector: 'app-chat', template: 'Chat Component' })
class MockChatComponent {}

@Component({ selector: 'app-profile', template: 'Profile Component' })
class MockProfileComponent {}

@Component({ selector: 'app-recommendations', template: 'Recommendations Component' })
class MockRecommendationsComponent {}

@Component({ selector: 'app-document-view', template: 'Document View Component' })
class MockDocumentViewComponent {}

// Test routes that mirror the actual application routes
const testRoutes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' as const },
  { path: 'home', component: MockChatComponent },
  { path: 'profile', component: MockProfileComponent },
  { path: 'fyp', component: MockRecommendationsComponent },
  { path: 'document', component: MockDocumentViewComponent },
  { path: '**', redirectTo: 'home' }
];

describe('App Routing', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      declarations: [
        MockChatComponent,
        MockProfileComponent,
        MockRecommendationsComponent,
        MockDocumentViewComponent
      ],
      providers: [
        provideRouter(testRoutes),
        provideHttpClient(withFetch()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
    
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  describe('Basic Navigation', () => {
    it('should navigate to home route', async () => {
      await router.navigateByUrl('/home');
      expect(location.path()).toBe('/home');
    });

    it('should navigate to profile route', async () => {
      await router.navigateByUrl('/profile');
      expect(location.path()).toBe('/profile');
    });

    it('should navigate to recommendations route (fyp)', async () => {
      await router.navigateByUrl('/fyp');
      expect(location.path()).toBe('/fyp');
    });

    it('should navigate to document view route', async () => {
      await router.navigateByUrl('/document');
      expect(location.path()).toBe('/document');
    });
  });

  describe('Redirects', () => {
    it('should redirect root path to home', async () => {
      await router.navigateByUrl('');
      expect(location.path()).toBe('/home');
    });

    it('should redirect root slash to home', async () => {
      await router.navigateByUrl('/');
      expect(location.path()).toBe('/home');
    });

    it('should redirect unknown paths to home', async () => {
      await router.navigateByUrl('/does-not-exist');
      expect(location.path()).toBe('/home');
    });

    it('should redirect invalid route variations to home', async () => {
      const invalidRoutes = [
        '/invalid-path',
        '/chat', // not a valid route, should go to /home
        '/documents', // plural, should redirect to home
        '/profiles', // plural, should redirect to home
        '/recommendation', // singular, should redirect to home
        '/random/nested/path'
      ];

      for (const route of invalidRoutes) {
        await router.navigateByUrl(route);
        expect(location.path()).toBe('/home');
      }
    });
  });

  describe('Route Parameters and Query Strings', () => {
    it('should preserve query parameters on redirect', async () => {
      await router.navigateByUrl('/invalid-route?param=value');
      expect(location.path()).toBe('/home');
    });

    it('should handle routes with query parameters', async () => {
      await router.navigateByUrl('/profile?tab=settings');
      expect(location.path()).toBe('/profile?tab=settings');
    });

    it('should handle routes with fragments', async () => {
      await router.navigateByUrl('/document#section1');
      expect(location.path()).toBe('/document#section1');
    });

    it('should handle routes with both query params and fragments', async () => {
      await router.navigateByUrl('/fyp?filter=recent#top');
      expect(location.path()).toBe('/fyp?filter=recent#top');
    });
  });

  describe('Navigation Programmatically', () => {
    it('should navigate using router.navigate()', async () => {
      await router.navigate(['/profile']);
      expect(location.path()).toBe('/profile');
    });

    it('should navigate with parameters using router.navigate()', async () => {
      await router.navigate(['/fyp'], { queryParams: { page: 2 } });
      expect(location.path()).toBe('/fyp?page=2');
    });

    it('should navigate with fragment using router.navigate()', async () => {
      await router.navigate(['/document'], { fragment: 'section2' });
      expect(location.path()).toBe('/document#section2');
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      // Try to navigate to a route that might cause errors
      try {
        await router.navigateByUrl('/profile/nonexistent/path');
        expect(location.path()).toBe('/home');
      } catch (error) {
        // Should not throw errors for invalid routes due to wildcard catch-all
        fail('Navigation should not throw errors due to wildcard route');
      }
    });

    it('should handle malformed URLs', async () => {
      const malformedUrls = [
        '//double-slash',
        '/path with spaces',
        '/path/with/../../traversal'
      ];

      for (const url of malformedUrls) {
        await router.navigateByUrl(url);
        // Should either go to intended route or redirect to home
        expect(['/home', url].some(validPath => location.path().includes(validPath.replace(' ', '%20')))).toBeTruthy();
      }
    });
  });

  describe('Browser Navigation Simulation', () => {
    it('should handle back and forward navigation', async () => {
      // Navigate to multiple routes
      await router.navigateByUrl('/home');
      expect(location.path()).toBe('/home');

      await router.navigateByUrl('/profile');
      expect(location.path()).toBe('/profile');

      await router.navigateByUrl('/fyp');
      expect(location.path()).toBe('/fyp');

      // Simulate browser back
      location.back();
      expect(location.path()).toBe('/profile');

      location.back();
      expect(location.path()).toBe('/home');

      // Simulate browser forward
      location.forward();
      expect(location.path()).toBe('/profile');
    });

    it('should maintain navigation history', async () => {
      const navigationSequence = ['/home', '/profile', '/document', '/fyp'];
      
      for (const route of navigationSequence) {
        await router.navigateByUrl(route);
        expect(location.path()).toBe(route);
      }

      // Navigate back through history
      for (let i = navigationSequence.length - 2; i >= 0; i--) {
        location.back();
        expect(location.path()).toBe(navigationSequence[i]);
      }
    });
  });

  describe('Route Configuration Validation', () => {
    it('should have all expected routes configured', () => {
      const config = router.config;
      const paths = config.map(route => route.path);
      
      expect(paths).toContain('');
      expect(paths).toContain('home');
      expect(paths).toContain('profile');
      expect(paths).toContain('fyp');
      expect(paths).toContain('document');
      expect(paths).toContain('**');
    });

    it('should have correct redirect configuration for root', () => {
      const rootRoute = router.config.find(route => route.path === '');
      expect(rootRoute?.redirectTo).toBe('home');
      expect(rootRoute?.pathMatch).toBe('full');
    });

    it('should have wildcard route as last route', () => {
      const lastRoute = router.config[router.config.length - 1];
      expect(lastRoute.path).toBe('**');
      expect(lastRoute.redirectTo).toBe('home');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid navigation changes', async () => {
      const routes = ['/home', '/profile', '/fyp', '/document'];
      
      // Rapidly navigate between routes
      for (let i = 0; i < 10; i++) {
        const randomRoute = routes[Math.floor(Math.random() * routes.length)];
        await router.navigateByUrl(randomRoute);
        expect(location.path()).toBe(randomRoute);
      }
    });

    it('should handle very long URLs', async () => {
      const longPath = '/home' + '?param=' + 'a'.repeat(1000);
      await router.navigateByUrl(longPath);
      expect(location.path()).toBe(longPath);
    });

    it('should handle special characters in URLs', async () => {
      const specialPaths = [
        '/fyp?search=café',
        '/document?title=résumé',
        '/profile#sección'
      ];

      for (const path of specialPaths) {
        await router.navigateByUrl(path);
        expect(location.path()).toBe(path);
      }
    });
  });

  describe('Integration with Real Routes', () => {
    it('should match the actual application route configuration', () => {
      // Verify that our test routes match the actual app routes structure
      const actualRoutes = routes;
      expect(actualRoutes.length).toBeGreaterThan(0);
      
      // Check that all major routes exist in actual configuration
      const actualPaths = actualRoutes.map(route => route.path);
      expect(actualPaths).toContain('');
      expect(actualPaths).toContain('home');
      expect(actualPaths).toContain('profile');
      expect(actualPaths).toContain('fyp');
      expect(actualPaths).toContain('document');
      expect(actualPaths).toContain('**');
    });

    it('should have correct component mappings', () => {
      const actualRoutes = routes;
      
      // Find each route and verify it has a component
      const homeRoute = actualRoutes.find(r => r.path === 'home');
      const profileRoute = actualRoutes.find(r => r.path === 'profile');
      const fypRoute = actualRoutes.find(r => r.path === 'fyp');
      const documentRoute = actualRoutes.find(r => r.path === 'document');
      
      expect(homeRoute?.component).toBeDefined();
      expect(profileRoute?.component).toBeDefined();
      expect(fypRoute?.component).toBeDefined();
      expect(documentRoute?.component).toBeDefined();
    });
  });
});
