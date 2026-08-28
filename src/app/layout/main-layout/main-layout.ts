import {
  Component,
  computed,
  inject,
  linkedSignal,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { ChevronDown } from '@primeicons/angular/chevron-down';
import { Sidebar as SidebarIcon } from '@primeicons/angular/sidebar';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';
import { UpperCasePipe } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AuthActions } from '../../core/store/auth/auth.actions';
import { selectLanguage, selectTheme } from '../../core/store/ui/ui.selectors';
import { Language, Theme } from '../../core/models';
import { UiActions } from '../../core/store/ui/ui.actions';

@Component({
  imports: [
    AvatarModule,
    SidebarModule,
    ButtonModule,
    ChevronDown,
    SidebarIcon,
    RouterOutlet,
    Sidebar,
    MenuModule,
    UpperCasePipe,
  ],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit, OnDestroy {
  private store = inject(Store);

  user = this.store.selectSignal(selectCurrentUser);
  theme = this.store.selectSignal(selectTheme);
  language = this.store.selectSignal(selectLanguage);

  isMobile = signal(false);
  open = signal(true);

  private mql?: MediaQueryList;
  private mqlListener?: (e: MediaQueryListEvent) => void;

  userItems: Signal<MenuItem[]> = computed(() => {
    const user = this.user();
    const theme = this.theme();
    const language = this.language();

    return [
      {
        label: user?.email,
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
  });

  ngOnInit() {
    if (typeof window === 'undefined') return;
    this.mql = window.matchMedia('(max-width: 1023px)');
    this.isMobile.set(this.mql.matches);
    this.open.set(!this.mql.matches);
    this.mqlListener = (e) => {
      this.isMobile.set(e.matches);
      this.open.set(!e.matches);
    };
    this.mql.addEventListener('change', this.mqlListener);
  }

  ngOnDestroy() {
    this.mql?.removeEventListener('change', this.mqlListener!);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  setTheme(theme: Theme): void {
    this.store.dispatch(UiActions.setTheme({ theme }));
  }

  setLanguage(language: Language): void {
    this.store.dispatch(UiActions.setLanguage({ language }));
  }
}
