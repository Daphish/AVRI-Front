// src/app/interceptors/token.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Token ${token}` } });
    }
    return next(req);
  }
}
