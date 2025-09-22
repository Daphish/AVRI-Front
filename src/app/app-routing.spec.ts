import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

@Component({ selector: 'app-dummy', template: 'dummy' }) class DummyComponent {}

const routes = [
  { path: 'home', component: DummyComponent },
  { path: 'document/:id', component: DummyComponent },
  { path: '**', redirectTo: 'home' },
];

describe('App Routing (starter suite)', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      providers: [provideRouter(routes), provideHttpClient(withFetch()), provideHttpClientTesting()],
    }).compileComponents();
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('unknown path redirects to /home', async () => {
    await router.navigateByUrl('/does-not-exist');
    expect(location.path()).toBe('/home');
  });

  it('deep-link /document/:id navigates to component', async () => {
    await router.navigateByUrl('/document/abc');
    expect(location.path()).toBe('/document/abc');
  });
});
