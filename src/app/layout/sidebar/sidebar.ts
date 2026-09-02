import { Component, inject, signal } from '@angular/core';

import { SidebarModule } from 'primeng/sidebar';
import { PIcon } from '@primeicons/angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';

type NavItem = {
  label: string;
  icon: string;
  link: string;
  visible?: boolean;
};

@Component({
  imports: [SidebarModule, RouterLink, PIcon, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private store = inject(Store);
  currentUser = this.store.selectSignal(selectCurrentUser);

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'home',
      link: '/',
    },
    {
      label: 'Users',
      icon: 'users',
      link: '/users',
      visible: this.currentUser()?.role === 'admin',
    },
    {
      label: 'Accounts',
      icon: 'wallet',
      link: '/accounts',
    },
    {
      label: 'Transactions',
      icon: 'arrow-right-arrow-left',
      link: '/transactions',
    },
    {
      label: 'Reports',
      icon: 'chart-bar',
      link: '/reports',
    },
    {
      label: 'Data Sources',
      icon: 'server',
      link: '/sources',
    },
  ];

  activeNivItem = signal<NavItem>(this.navItems[0]);
}
