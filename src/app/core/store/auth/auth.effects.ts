import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { getAuthErrorMessage } from '../../utils';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          switchMap((firebaseUser) =>
            this.authService.loadUserProfile(firebaseUser.uid).pipe(
              map((user) => {
                if (!user) {
                  return AuthActions.loginFailure({ error: 'User profile not found' });
                }
                return AuthActions.loginSuccess({ user });
              }),
            ),
          ),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: getAuthErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ email, password, displayName }) =>
        this.authService.register(email, password, displayName).pipe(
          map((user) => AuthActions.registerSuccess({ user })),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: getAuthErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())), // still clear state
        ),
      ),
    ),
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/login'])),
      ),
    { dispatch: false },
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => this.router.navigate(['/'])),
      ),
    { dispatch: false },
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      switchMap(() =>
        this.authService.currentUser$().pipe(
          map((user) => AuthActions.loadUserSuccess({ user })),
          tap(({ user }) => {
            if (user) {
              this.router.navigate(['/']);
            }
          }),
          catchError((error) =>
            of(AuthActions.loadUserFailure({ error: getAuthErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateUser),
      switchMap(() =>
        this.authService.currentUser$().pipe(
          map((user) => AuthActions.updateUserSuccess({ user })),
          catchError((error) =>
            of(AuthActions.updateUserFailure({ error: getAuthErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => this.router.navigate(['/'])),
      ),
    { dispatch: false },
  );
}
