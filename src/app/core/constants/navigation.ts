import { Router } from '@angular/router';
import { UserRole } from '@core/models';
import { AuthActions } from '@core/store/auth';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';

export const userBlockNavigation: (email: string, store: Store, router: Router) => MenuItem[] = (
  email: string,
  store: Store,
  router: Router,
) => {
  return [
    {
      label: email,
      disabled: true,
    },
    { separator: true },
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => {
        // navigate to profile later
      },
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        router.navigate(['/settings']);
      },
    },
    { separator: true },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => store.dispatch(AuthActions.logout()),
    },
  ];
};

export const sidebarNavigation = (role: UserRole): MenuItem[] => [
  {
    label: 'Dashboard',
    icon: 'home',
    routerLink: '/',
  },
  {
    label: 'Users',
    icon: 'users',
    routerLink: '/users',
    visible: role === 'admin',
  },
  {
    label: 'Accounts',
    icon: 'wallet',
    routerLink: '/accounts',
  },
  {
    label: 'Transactions',
    icon: 'arrow-right-arrow-left',
    routerLink: '/transactions',
  },
  {
    label: 'Reports',
    icon: 'chart-bar',
    routerLink: '/reports',
  },
  {
    label: 'Data Sources',
    icon: 'server',
    routerLink: '/sources',
  },
];
