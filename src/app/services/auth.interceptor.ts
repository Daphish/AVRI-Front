import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  // DRF TokenAuthentication waits 'Token <token>'
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Token ${token}` } })
    : req;
  return next(authReq);
};
