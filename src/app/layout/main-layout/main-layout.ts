import { Component, computed, DestroyRef, inject, linkedSignal, Signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { ChevronDown } from '@primeicons/angular/chevron-down';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Store } from '@ngrx/store';
import { UpperCasePipe } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { filter, fromEvent, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { isMobileQuery } from '@core/utils';
import { AuthActions, selectCurrentUser } from '@core/store/auth';
import { PIcon } from '@primeicons/angular';
import { UserAvatar } from '@shared/components/user-avatar/user-avatar';

@Component({
  imports: [
    AvatarModule,
    SidebarModule,
    ButtonModule,
    RouterOutlet,
    Sidebar,
    MenuModule,
    PIcon,
    UserAvatar
  ],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {
  private store = inject(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

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

    return [
      {
        label: user?.email,
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
          this.router.navigate(['/settings']);
        },
      },
      { separator: true },
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: () => this.store.dispatch(AuthActions.logout()),
      },
    ];
  });
}
