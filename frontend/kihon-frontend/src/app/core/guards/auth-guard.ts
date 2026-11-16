
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth';

// ==========================================
// PROTEGER RUTAS AUTENTICADAS
// ==========================================

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// ==========================================
// PROTEGER RUTAS SEGÚN ROL
// ==========================================

export const roleGuard: CanActivateFn = (route) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as string[];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.hasRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};
