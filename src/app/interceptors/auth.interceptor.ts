import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const userToken = localStorage.getItem('token');
  const modifiedReq = req.clone({
    headers: req.headers.set('Authorization', `Token ${userToken}`),
  });
  return next(modifiedReq);
};
