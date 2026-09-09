import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, toArray } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { User } from '../../models';
import { AuthState, initialAuthState } from './auth.models';
import {
  selectAuthError,
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionChecking,
} from './auth.selectors';

const user: User = { id: 'u1', email: 'a@b.com', displayName: 'A', role: 'client' };

function configureStore(auth: AuthState) {
  TestBed.configureTestingModule({
    providers: [provideMockStore({ initialState: { auth } })],
  });
  return TestBed.inject(Store);
}

describe('auth.selectors', () => {
  it('should select the current user', async () => {
    const store = configureStore({ ...initialAuthState, user });
    expect(await firstValueFrom(store.select(selectCurrentUser))).toEqual(user);
  });

  it('should select isAuthenticated', async () => {
    const store = configureStore({ ...initialAuthState, isAuthenticated: true });
    expect(await firstValueFrom(store.select(selectIsAuthenticated))).toBe(true);
  });

  it('should select loading', async () => {
    const store = configureStore({ ...initialAuthState, loading: true });
    expect(await firstValueFrom(store.select(selectAuthLoading))).toBe(true);
  });

  it('should select error', async () => {
    const store = configureStore({ ...initialAuthState, error: 'boom' });
    expect(await firstValueFrom(store.select(selectAuthError))).toBe('boom');
  });

  it('should select sessionChecking', async () => {
    const store = configureStore({ ...initialAuthState, sessionChecking: true });
    expect(await firstValueFrom(store.select(selectSessionChecking))).toBe(true);
  });
});