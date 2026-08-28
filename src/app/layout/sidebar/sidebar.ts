import { Component, signal } from '@angular/core';

import { SidebarModule } from 'primeng/sidebar';
import { PIcon } from '@primeicons/angular';
import { RouterLink } from '@angular/router';

type NavItem = {
  label: string;
  icon: string;
  link: string;
};

@Component({
  imports: [SidebarModule, RouterLink, PIcon],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  navItems = [
    {
      label: 'Dashboard',
      icon: 'home',
      link: '/',
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
