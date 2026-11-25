
import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { EstudianteLayout } from './layouts/estudiante-layout/estudiante-layout';
import { authGuard, roleGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // LOGIN
  {
    path: 'login',
    component: Login,
  },

  // ADMINISTRADOR
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard')
            .then(m => m.Dashboard),
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./pages/admin/estudiantes/estudiantes')
            .then(m => m.Estudiantes),
      },
      {
        path: 'grupos',
        loadComponent: () =>
          import('./pages/admin/grupos/grupos')
            .then(m => m.Grupos),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/admin/reportes/reportes')
            .then(m => m.Reportes),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/admin/usuarios/usuarios')
            .then(m => m.Usuarios),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil')
            .then(m => m.Perfil),
      },

      {
  path: 'asistencias',
  loadComponent: () =>
    import('./pages/admin/asistencias/asistencias')
      .then(m => m.Asistencias),
},

{
  path: 'horario',
  loadComponent: () =>
    import('./pages/admin/horario/horario')
      .then(m => m.Horario),
},

{
  path: 'inscripciones',
  loadComponent: () =>
    import('./pages/admin/inscripciones/inscripciones')
      .then(m => m.Inscripciones),
},

      {
        path: '',
        redirectTo: 'admin',
        pathMatch: 'full',
      },
    ],
  },

  // ESTUDIANTE
  {
    path: 'estudiante',
    component: EstudianteLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ESTUDIANTE'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/estudiante/dashboard/dashboard')
            .then(m => m.EstudianteDashboard),
      },
      {
        path: 'grupos',
        loadComponent: () =>
          import('./pages/estudiante/grupos/grupos')
            .then(m => m.EstudianteGrupos),
      },
      {
        path: 'asistencias',
        loadComponent: () =>
          import('./pages/estudiante/asistencias/asistencias')
            .then(m => m.EstudianteAsistencias),
      },
      {
        path: 'horario',
        loadComponent: () =>
          import('./pages/estudiante/horario/horario')
            .then(m => m.EstudianteHorario),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil')
            .then(m => m.Perfil),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ACCESO DENEGADO
  {
    path: 'acceso-denegado',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/access-denied/access-denied')
        .then(m => m.AccessDenied),
  },

  // RUTA PRINCIPAL
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // RUTA NO ENCONTRADA
  {
    path: '**',
    redirectTo: 'login',
  },
];
