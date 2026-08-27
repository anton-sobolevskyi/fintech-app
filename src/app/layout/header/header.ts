import { Component, computed, inject, Signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { selectLanguage, selectSidebarOpened, selectTheme } from '../../core/store/ui/ui.selectors';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { UiActions } from '../../core/store/ui/ui.actions';
import { AuthActions } from '../../core/store/auth/auth.actions';

import { Bars, ChevronDown } from '@primeicons/angular';
import { Language, Theme } from '../../core/models';

@Component({
  imports: [
    ButtonModule,
    MenuModule,
    AvatarModule,
    UpperCasePipe,
    TooltipModule,
    Bars,
    ChevronDown,
  ],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private store = inject(Store);

  user = this.store.selectSignal(selectCurrentUser);
  theme = this.store.selectSignal(selectTheme);
  language = this.store.selectSignal(selectLanguage);
  sidebarOpened = this.store.selectSignal(selectSidebarOpened);

  userMenuItems: Signal<MenuItem[]> = computed(() => {
    const theme = this.theme();
    const language = this.language();

    const items = [
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
          // navigate to settings later
        },
      },
      {
        label: 'Appearance',
        items: [
          {
            label: 'Light',
            icon: theme === 'light' ? 'pi pi-dot' : 'pi pi-blank',
            command: () => this.setTheme('light'),
          },
          {
            label: 'Dark',
            icon: theme === 'dark' ? 'pi pi-dot' : 'pi pi-blank',
            command: () => this.setTheme('dark'),
          },
          {
            label: 'System',
            icon: theme === 'system' ? 'pi pi-dot' : 'pi pi-blank',
            command: () => this.setTheme('system'),
          },
        ],
      },
      { separator: true },
      {
        label: 'Language',
        items: [
          {
            label: 'English',
            icon: language === 'en' ? 'pi pi-dot' : 'pi pi-blank',
            command: () => this.setLanguage('en'),
          },
          {
            label: 'Українська',
            icon: language === 'uk' ? 'pi pi-dot' : 'pi pi-blank',
            command: () => this.setLanguage('uk'),
          },
        ],
      },
      { separator: true },
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];

    return items;
  });

  toggleSidebar(): void {
    this.store.dispatch(UiActions.toggleSidebar());
  }

  setTheme(theme: Theme): void {
    this.store.dispatch(UiActions.setTheme({ theme }));
  }

  setLanguage(language: Language): void {
    this.store.dispatch(UiActions.setLanguage({ language }));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
