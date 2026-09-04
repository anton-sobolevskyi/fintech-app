import { Component, inject, signal } from '@angular/core';

import { SidebarModule } from 'primeng/sidebar';
import { PIcon } from '@primeicons/angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { sidebarNavigation } from '@core/constants';

@Component({
  imports: [SidebarModule, RouterLink, PIcon, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private store = inject(Store);
  currentUser = this.store.selectSignal(selectCurrentUser);

  navItems = sidebarNavigation(this.currentUser()?.role ?? 'viewer');

  activeNivItem = signal(this.navItems[0]);
}
