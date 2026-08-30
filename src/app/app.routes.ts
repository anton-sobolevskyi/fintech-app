import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts/accounts').then((m) => m.Accounts),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions/transactions').then((m) => m.Transactions),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'sources',
        loadComponent: () =>
          import('./features/data-sources/data-sources/data-sources').then((m) => m.DataSources),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
