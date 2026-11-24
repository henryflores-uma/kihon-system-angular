
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';

import { AuthService } from '../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const isBackendRequest = req.url.startsWith(environment.apiUrl);

  // No modificar peticiones externas al backend
  if (!isBackendRequest) {
    return next(req);
  }

  // Todas las peticiones al backend deben enviar la cookie JSESSIONID
  const requestWithCredentials = req.clone({
    withCredentials: true
  });

  // Métodos que necesitan protección CSRF
  const methodsWithCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'];

  const requiresCsrf = methodsWithCsrf.includes(req.method);

  // Las consultas GET no necesitan encabezado CSRF
  if (!requiresCsrf || req.headers.has('X-CSRF-TOKEN')) {
    return next(requestWithCredentials);
  }

  // Consultar el token si todavía no está disponible
  const csrfToken = authService.getCsrfToken();

  if (csrfToken) {
    return next(
      requestWithCredentials.clone({
        setHeaders: {
          'X-CSRF-TOKEN': csrfToken
        }
      })
    );
  }

  // Obtener CSRF automáticamente cuando no existe
  return authService.obtenerCsrf().pipe(
    switchMap(token => {

      const authenticatedRequest = requestWithCredentials.clone({
        setHeaders: {
          'X-CSRF-TOKEN': token
        }
      });

      return next(authenticatedRequest);
    })
  );
};
