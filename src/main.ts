import { bootstrapApplication } from "@angular/platform-browser";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { authInterceptor } from "./app/services/auth.interceptor";
import { AuthService } from "./app/services/auth.service";
import { APP_INITIALIZER } from "@angular/core";

export function initializeApp(authService: AuthService): () => Promise<void> {
  return () => authService.autoLogin();
}

bootstrapApplication(AppComponent, {
  providers: [
    // Configura el interceptor funcional correctamente
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    // Rutas de la aplicación
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
