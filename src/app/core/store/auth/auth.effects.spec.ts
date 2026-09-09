import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { User as FirebaseUser } from 'firebase/auth';
import { Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { AuthActions } from './auth.actions';
import { AuthEffects } from './auth.effects';

const user: User = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'client',
};

const firebaseUser = { uid: 'u1', email: 'a@b.com' } as unknown as FirebaseUser;

describe('AuthEffects', () => {
  let actions$: Subject<Action>;
  let effects: AuthEffects;
  let router: Router;
  let authService: {
    login: ReturnType<typeof vi.fn>;
    loadUserProfile: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    currentUser$: ReturnType<typeof vi.fn>;
  };

  const navigate = vi.fn();

  beforeEach(() => {
    actions$ = new Subject<Action>();
    authService = {
      login: vi.fn(),
      loadUserProfile: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      currentUser$: vi.fn(),
    };
    navigate.mockReset();
    navigate.mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        provideMockStore({}),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigate } },
      ],
    });
    effects = TestBed.inject(AuthEffects);
    router = TestBed.inject(Router);
  });

  describe('login$', () => {
    it('should load the profile and dispatch loginSuccess', () => {
      authService.login.mockReturnValue(of(firebaseUser));
      authService.loadUserProfile.mockReturnValue(of(user));

      const result: Action[] = [];
      effects.login$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.login({ email: 'a@b.com', password: 'pw' }));

      expect(authService.login).toHaveBeenCalledWith('a@b.com', 'pw');
      expect(authService.loadUserProfile).toHaveBeenCalledWith('u1');
      expect(result).toEqual([AuthActions.loginSuccess({ user })]);
    });

    it('should dispatch loginFailure when the profile is missing', () => {
      authService.login.mockReturnValue(of(firebaseUser));
      authService.loadUserProfile.mockReturnValue(of(null));

      const result: Action[] = [];
      effects.login$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.login({ email: 'a@b.com', password: 'pw' }));

      expect(result).toEqual([AuthActions.loginFailure({ error: 'User profile not found' })]);
    });

    it('should dispatch loginFailure with a friendly message on error', () => {
      authService.login.mockReturnValue(throwError(() => new Error('boom')));

      const result: Action[] = [];
      effects.login$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.login({ email: 'a@b.com', password: 'pw' }));

      expect(result).toEqual([
        AuthActions.loginFailure({ error: 'Something went wrong. Please try again.' }),
      ]);
    });
  });

  describe('register$', () => {
    it('should dispatch registerSuccess', () => {
      authService.register.mockReturnValue(of(user));
      const result: Action[] = [];
      effects.register$.subscribe((a) => result.push(a));
      actions$.next(
        AuthActions.register({ email: 'a@b.com', password: 'pw', displayName: 'Alice' }),
      );
      expect(authService.register).toHaveBeenCalledWith('a@b.com', 'pw', 'Alice');
      expect(result).toEqual([AuthActions.registerSuccess({ user })]);
    });

    it('should dispatch registerFailure on error', () => {
      authService.register.mockReturnValue(throwError(() => new Error('boom')));
      const result: Action[] = [];
      effects.register$.subscribe((a) => result.push(a));
      actions$.next(
        AuthActions.register({ email: 'a@b.com', password: 'pw', displayName: 'Alice' }),
      );
      expect(result).toEqual([
        AuthActions.registerFailure({ error: 'Something went wrong. Please try again.' }),
      ]);
    });
  });

  describe('logout$', () => {
    it('should dispatch logoutSuccess', () => {
      authService.logout.mockReturnValue(of(undefined));
      const result: Action[] = [];
      effects.logout$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.logout());
      expect(result).toEqual([AuthActions.logoutSuccess()]);
    });

    it('should still dispatch logoutSuccess when logout fails', () => {
      authService.logout.mockReturnValue(throwError(() => new Error('boom')));
      const result: Action[] = [];
      effects.logout$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.logout());
      expect(result).toEqual([AuthActions.logoutSuccess()]);
    });
  });
  describe('logoutSuccess$', () => {
    it('should navigate to /login', () => {
      const sub = effects.logoutSuccess$.subscribe();
      actions$.next(AuthActions.logoutSuccess());
      expect(navigate).toHaveBeenCalledWith(['/login']);
      sub.unsubscribe();
    });
  });

  describe('registerSuccess$', () => {
    it('should navigate to /', () => {
      const sub = effects.registerSuccess$.subscribe();
      actions$.next(AuthActions.registerSuccess({ user }));
      expect(navigate).toHaveBeenCalledWith(['/']);
      sub.unsubscribe();
    });
  });

  describe('loginSuccess$', () => {
    it('should navigate to /', () => {
      const sub = effects.loginSuccess$.subscribe();
      actions$.next(AuthActions.loginSuccess({ user }));
      expect(navigate).toHaveBeenCalledWith(['/']);
      sub.unsubscribe();
    });
  });

  describe('loadUser$', () => {
    it('should dispatch loadUserSuccess with the user and navigate to /', () => {
      authService.currentUser$.mockReturnValue(of(user));
      const result: Action[] = [];
      effects.loadUser$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.loadUser());
      expect(result).toEqual([AuthActions.loadUserSuccess({ user })]);
      expect(navigate).toHaveBeenCalledWith(['/']);
    });

    it('should dispatch loadUserSuccess with null for guests and avoid navigation', () => {
      authService.currentUser$.mockReturnValue(of(null));
      const result: Action[] = [];
      effects.loadUser$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.loadUser());
      expect(result).toEqual([AuthActions.loadUserSuccess({ user: null })]);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('should dispatch loadUserFailure on error', () => {
      authService.currentUser$.mockReturnValue(throwError(() => new Error('boom')));
      const result: Action[] = [];
      effects.loadUser$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.loadUser());
      expect(result).toEqual([
        AuthActions.loadUserFailure({ error: 'Something went wrong. Please try again.' }),
      ]);
    });
  });

  describe('updateUser$', () => {
    it('should dispatch updateUserSuccess', () => {
      authService.currentUser$.mockReturnValue(of(user));
      const result: Action[] = [];
      effects.updateUser$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.updateUser());
      expect(result).toEqual([AuthActions.updateUserSuccess({ user })]);
    });

    it('should dispatch updateUserFailure on error', () => {
      authService.currentUser$.mockReturnValue(throwError(() => new Error('boom')));
      const result: Action[] = [];
      effects.updateUser$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.updateUser());
      expect(result).toEqual([
        AuthActions.updateUserFailure({ error: 'Something went wrong. Please try again.' }),
      ]);
    });
  });
});