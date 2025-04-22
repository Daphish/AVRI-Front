// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideClientHydration } from '@angular/platform-browser';

import {
  provideHttpClient,
  withFetch,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

import { TokenInterceptor } from './interceptors/token.interceptor';

/**
 * Configuración global de la aplicación
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Detección de cambios optimizada
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Rutas
    provideRouter(routes),

    // Hydration opcional (la puedes quitar si sigues en modo CSR puro)
    provideClientHydration(),

    // HttpClient usando el backend Fetch de Angular 17+
    provideHttpClient(withFetch()),

    // Interceptor que agrega el header Authorization
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
};
