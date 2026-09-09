import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../models';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { AuthActions } from '../auth/auth.actions';
import { initialAuthState } from '../auth/auth.models';
import { UiActions } from './ui.actions';
import { UiEffects } from './ui.effects';

const user: User = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'client',
};

describe('UiEffects', () => {
  let actions$: Subject<Action>;
  let effects: UiEffects;
  let preferencesService: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    preferencesService = { load: vi.fn(), save: vi.fn() };
    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = 'en';

    TestBed.configureTestingModule({
      providers: [
        UiEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: { auth: { ...initialAuthState, user } },
        }),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: UserPreferencesService, useValue: preferencesService },
      ],
    });
    effects = TestBed.inject(UiEffects);
  });

  describe('loadPreferences$', () => {
    it('should load, apply and dispatch preferences for a signed-in user', () => {
      preferencesService.load.mockReturnValue(of({ id: 'u1', theme: 'dark', language: 'uk' }));
      const result: Action[] = [];
      effects.loadPreferences$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.loadUserSuccess({ user }));

      expect(preferencesService.load).toHaveBeenCalledWith('u1');
      expect(result).toEqual([UiActions.preferencesLoaded({ theme: 'dark', language: 'uk' })]);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.lang).toBe('uk');
    });

    it('should do nothing for guests', () => {
      const result: Action[] = [];
      effects.loadPreferences$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.loadUserSuccess({ user: null }));
      expect(preferencesService.load).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should swallow preference loading errors', () => {
      preferencesService.load.mockReturnValue(throwError(() => new Error('boom')));
      const result: Action[] = [];
      effects.loadPreferences$.subscribe((a) => result.push(a));
      actions$.next(AuthActions.loginSuccess({ user }));
      expect(result).toEqual([]);
    });
  });

  describe('changeTheme$', () => {
    it('should apply the theme to the DOM and persist it', () => {
      preferencesService.save.mockReturnValue(of(undefined));
      const sub = effects.changeTheme$.subscribe();
      actions$.next(UiActions.setTheme({ theme: 'dark' }));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(preferencesService.save).toHaveBeenCalledWith('u1', { theme: 'dark' });
      sub.unsubscribe();
    });

    it('should remove the dark class for a light theme', () => {
      document.documentElement.classList.add('dark');
      preferencesService.save.mockReturnValue(of(undefined));
      const sub = effects.changeTheme$.subscribe();
      actions$.next(UiActions.setTheme({ theme: 'light' }));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      sub.unsubscribe();
    });

    it('should ignore the system theme when the media query says light', () => {
      preferencesService.save.mockReturnValue(of(undefined));
      const sub = effects.changeTheme$.subscribe();
      actions$.next(UiActions.setTheme({ theme: 'system' }));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      sub.unsubscribe();
    });

    it('should apply dark when system theme matches dark preference', () => {
      matchMediaMock.mockReturnValue({ matches: true });
      preferencesService.save.mockReturnValue(of(undefined));
      const sub = effects.changeTheme$.subscribe();
      actions$.next(UiActions.setTheme({ theme: 'system' }));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      sub.unsubscribe();
    });
  });

  describe('without a signed-in user', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      actions$ = new Subject<Action>();
      preferencesService = { load: vi.fn(), save: vi.fn() };
      TestBed.configureTestingModule({
        providers: [
          UiEffects,
          provideMockActions(() => actions$),
          provideMockStore({ initialState: { auth: { ...initialAuthState, user: null } } }),
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: UserPreferencesService, useValue: preferencesService },
        ],
      });
      effects = TestBed.inject(UiEffects);
    });

    it('should not persist theme changes for guests', () => {
      const sub = effects.changeTheme$.subscribe();
      actions$.next(UiActions.setTheme({ theme: 'dark' }));
      expect(preferencesService.save).not.toHaveBeenCalled();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      sub.unsubscribe();
    });

    it('should not persist language changes for guests', () => {
      const sub = effects.changeLanguage$.subscribe();
      actions$.next(UiActions.setLanguage({ language: 'uk' }));
      expect(preferencesService.save).not.toHaveBeenCalled();
      expect(document.documentElement.lang).toBe('uk');
      sub.unsubscribe();
    });
  });

  describe('changeLanguage$', () => {
    it('should apply the language to the DOM and persist it', () => {
      preferencesService.save.mockReturnValue(of(undefined));
      const sub = effects.changeLanguage$.subscribe();
      actions$.next(UiActions.setLanguage({ language: 'uk' }));
      expect(document.documentElement.lang).toBe('uk');
      expect(preferencesService.save).toHaveBeenCalledWith('u1', { language: 'uk' });
      sub.unsubscribe();
    });

    it('should swallow persistence errors', () => {
      preferencesService.save.mockReturnValue(throwError(() => new Error('boom')));
      const sub = effects.changeLanguage$.subscribe();
      expect(() => {
        actions$.next(UiActions.setLanguage({ language: 'en' }));
      }).not.toThrow();
      sub.unsubscribe();
    });
  });
});