import { Component, computed, DestroyRef, inject, linkedSignal, Signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { filter, fromEvent, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { isMobileQuery } from '@core/utils';
import { selectCurrentUser } from '@core/store/auth';
import { PIcon } from '@primeicons/angular';
import { UserAvatar } from '@shared/components/user-avatar/user-avatar';
import { userBlockNavigation } from '@core/constants';

@Component({
  imports: [
    AvatarModule,
    SidebarModule,
    ButtonModule,
    RouterOutlet,
    Sidebar,
    MenuModule,
    PIcon,
    UserAvatar,
  ],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {
  private store = inject(Store);
  private router = inject(Router);

  user = this.store.selectSignal(selectCurrentUser);

  isMobile = toSignal(
    fromEvent<MediaQueryListEvent>(isMobileQuery, 'change').pipe(map((event) => event.matches)),
    { initialValue: isMobileQuery.matches },
  );
  isNavigationEnd = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd)));
  open = linkedSignal<boolean, boolean>({
    source: () => {
      const isMobile = this.isMobile();
      const isNavigationEnd = this.isNavigationEnd();

      if (isMobile && isNavigationEnd) {
        return false;
      }

      return !isMobile;
    },
    computation: (source, previous) => {
      const isMobile = this.isMobile();

      return isMobile ? source : Boolean(previous?.value);
    },
  });

  userItems: Signal<MenuItem[]> = computed(() => {
    const user = this.user();

    return user ? userBlockNavigation(user.email, this.store, this.router) : [];
  });
}
