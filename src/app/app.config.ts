// src/app/app.config.ts
import { ApplicationConfig }      from '@angular/core';
import { provideRouter }          from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors
}                                 from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { authInterceptor }        from './services/auth.interceptor';
import { routes }                 from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptors([ authInterceptor ])
    ),
  ]
};
