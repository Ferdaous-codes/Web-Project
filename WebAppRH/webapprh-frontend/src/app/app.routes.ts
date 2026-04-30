import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'employes',
        canActivate: [roleGuard(['Administrateur'])],
        loadComponent: () =>
          import('./features/employes/employes.component').then(m => m.EmployesComponent)
      },
      {
        path: 'departements',
        loadComponent: () =>
          import('./features/departements/departements.component').then(m => m.DepartementsComponent)
      },
      {
        path: 'conges',
        canActivate: [roleGuard(['Manager', 'Employe'])],
        loadComponent: () =>
          import('./features/conges/conges.component').then(m => m.CongesComponent)
      },
      {
        path: 'compte',
        loadComponent: () =>
          import('./features/compte/compte.component').then(m => m.CompteComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
