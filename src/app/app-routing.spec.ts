import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';

import { routes } from './app.routes';

@Component({
  selector: 'app-test',
  template: '<router-outlet></router-outlet>',
  standalone: true,
})
class TestComponent {}

describe('App Routing', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should create router', () => {
    expect(router).toBeTruthy();
  });

  it('should have correct number of routes', () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should redirect empty path to home', () => {
    const route = routes.find(r => r.path === '');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('home');
    expect(route?.pathMatch).toBe('full');
  });

  it('should have home route', () => {
    const route = routes.find(r => r.path === 'home');
    expect(route).toBeDefined();
    expect(route?.component).toBeDefined();
  });

  it('should have profile route', () => {
    const route = routes.find(r => r.path === 'profile');
    expect(route).toBeDefined();
    expect(route?.component).toBeDefined();
  });

  it('should have fyp route', () => {
    const route = routes.find(r => r.path === 'fyp');
    expect(route).toBeDefined();
    expect(route?.component).toBeDefined();
  });

  it('should have document route', () => {
    const route = routes.find(r => r.path === 'document');
    expect(route).toBeDefined();
    expect(route?.component).toBeDefined();
  });

  it('should redirect unknown paths to home', () => {
    const route = routes.find(r => r.path === '**');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('home');
  });
});
