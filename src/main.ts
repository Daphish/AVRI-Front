// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { provideRouter }        from '@angular/router';

import { AppComponent }    from './app/app.component';
import { routes }          from './app/app.routes';
import { authInterceptor } from './app/services/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    // Configura el interceptor funcional correctamente
    provideHttpClient(
      withInterceptors([ authInterceptor ])
    ),
    // Rutas de la aplicación
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
