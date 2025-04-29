import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const userToken = localStorage.getItem('token');
    if (userToken) {
      const modifiedReq = req.clone({
        headers: req.headers.set('Authorization', `Token ${userToken}`),
      });
      return next(modifiedReq);
    }
  }
  return next(req);
};
