import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

import { authGuard, roleGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // ==========================================
  // LOGIN
  // ==========================================

  {
    path: 'login',
    component: Login,
  },

  // ==========================================
  // ADMINISTRADOR
  // ==========================================

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN'],
    },
    children: [
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then((m) => m.Dashboard),
      },

      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./pages/admin/estudiantes/estudiantes').then((m) => m.Estudiantes),
      },

      {
        path: '',
        redirectTo: 'admin',
        pathMatch: 'full',
      },
    ],
  },

  // ==========================================
  // ACCESO DENEGADO
  // ==========================================

  {
    path: 'acceso-denegado',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/access-denied/access-denied').then((m) => m.AccessDenied),
  },

  // ==========================================
  // RUTA PRINCIPAL
  // ==========================================

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ==========================================
  // RUTA NO ENCONTRADA
  // ==========================================

  {
    path: '**',
    redirectTo: 'login',
  },
];
