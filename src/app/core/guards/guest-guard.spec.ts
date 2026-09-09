import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CanActivateFn, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthState, initialAuthState } from '../store/auth/auth.models';
import { guestGuard } from './guest-guard';

describe('guestGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  function setup(auth: AuthState): MockStore {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideMockStore({ initialState: { auth } })],
    });
    return TestBed.inject(MockStore);
  }

  it('should be created', () => {
    setup(initialAuthState);
    expect(executeGuard).toBeTruthy();
  });

  it('should allow guests through', async () => {
    setup({ ...initialAuthState, isAuthenticated: false, sessionChecking: false });
    const result = executeGuard({} as never, {} as never);
    expect(await firstValueFrom(result as Observable<boolean | UrlTree>)).toBe(true);
  });

  it('should redirect authenticated users to /', async () => {
    setup({ ...initialAuthState, isAuthenticated: true, sessionChecking: false });
    const result = executeGuard({} as never, {} as never);
    const value = await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(value).toBeInstanceOf(UrlTree);
    expect(value.toString()).toBe('/');
  });

  it('should wait while the session is being checked', async () => {
    const store = setup({ ...initialAuthState, sessionChecking: true });
    const results: (boolean | UrlTree)[] = [];
    const result = executeGuard({} as never, {} as never);
    (result as Observable<boolean | UrlTree>).subscribe((v) => results.push(v));
    expect(results).toHaveLength(0);

    store.setState({ auth: { ...initialAuthState, sessionChecking: false, isAuthenticated: false } });
    store.refreshState();

    await new Promise((resolve) => setTimeout(resolve));
    expect(results).toEqual([true]);
  });
});
