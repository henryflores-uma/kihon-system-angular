
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const isBackendRequest = req.url.startsWith(environment.apiUrl);

  const authorization = authService.getAuthorizationHeader();

  if (
    !isBackendRequest ||
    !authorization ||
    req.headers.has('Authorization')
  ) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: authorization
    }
  });

  return next(authenticatedRequest);
};
