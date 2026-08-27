import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from '../auth/auth.actions';
import { UiActions } from './ui.actions';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';

@Injectable()
export class UiEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  applyPreferences$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loadUserSuccess, AuthActions.loginSuccess, AuthActions.registerSuccess),
        tap(({ user }) => {
          if (!user?.preferences) return;

          const theme = user.preferences.theme || 'system';
          const language = user.preferences.language || 'uk';

          this.store.dispatch(UiActions.setTheme({ theme }));
          this.store.dispatch(UiActions.setLanguage({ language }));
        }),
      ),
    { dispatch: false },
  );

  changeTheme$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.setTheme),
        tap(({ theme }) => {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

          if (theme === 'system' && mediaQuery.matches) {
            document.documentElement.classList.add('dark');
          } else if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          this.store.dispatch(AuthActions.updatePreferences({ theme }));
        }),
      ),
    { dispatch: false },
  );

  changeLanguage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.setLanguage),
        tap(({ language }) => {
          document.documentElement.lang = language;
          this.store.dispatch(AuthActions.updatePreferences({ language }));
        }),
      ),
    { dispatch: false },
  );
}
