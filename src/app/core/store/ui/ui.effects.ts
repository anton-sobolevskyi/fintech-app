import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AuthActions } from '../auth/auth.actions';
import { selectCurrentUser } from '../auth/auth.selectors';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { Locale, Theme } from '../../models';
import { UiActions } from './ui.actions';

@Injectable()
export class UiEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private platformId = inject(PLATFORM_ID);
  private userPreferencesService = inject(UserPreferencesService);

  loadPreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserSuccess, AuthActions.loginSuccess, AuthActions.registerSuccess),
      switchMap(({ user }) => {
        if (!user) return EMPTY;

        return this.userPreferencesService.load(user.id).pipe(
          tap(({ theme, language }) => {
            this.applyThemeToDom(theme);
            this.applyLanguageToDom(language);
          }),
          map(({ theme, language }) => UiActions.preferencesLoaded({ theme, language })),
          catchError(() => EMPTY),
        );
      }),
    ),
  );

  changeTheme$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.setTheme),
        tap(({ theme }) => this.applyThemeToDom(theme)),
        withLatestFrom(this.store.select(selectCurrentUser)),
        switchMap(([{ theme }, user]) =>
          user
            ? this.userPreferencesService.save(user.id, { theme }).pipe(catchError(() => EMPTY))
            : EMPTY,
        ),
      ),
    { dispatch: false },
  );

  changeLanguage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.setLanguage),
        tap(({ language }) => this.applyLanguageToDom(language)),
        withLatestFrom(this.store.select(selectCurrentUser)),
        switchMap(([{ language }, user]) =>
          user
            ? this.userPreferencesService.save(user.id, { language }).pipe(catchError(() => EMPTY))
            : EMPTY,
        ),
      ),
    { dispatch: false },
  );

  private applyThemeToDom(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    if (theme === 'system' && mediaQuery.matches) {
      document.documentElement.classList.add('dark');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyLanguageToDom(language: Locale): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.documentElement.lang = language;
  }
}
