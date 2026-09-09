import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CanActivateFn, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthState, initialAuthState } from '../store/auth/auth.models';
import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

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

  it('should allow admin users', async () => {
    setup({
      ...initialAuthState,
      loading: false,
      user: { id: 'u1', email: 'a@b.com', displayName: 'A', role: 'admin' },
    });
    const result = executeGuard({} as never, {} as never);
    expect(await firstValueFrom(result as Observable<boolean | UrlTree>)).toBe(true);
  });

  it('should redirect non-admin users to /', async () => {
    setup({
      ...initialAuthState,
      loading: false,
      user: { id: 'u2', email: 'b@b.com', displayName: 'B', role: 'client' },
    });
    const result = executeGuard({} as never, {} as never);
    const value = await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(value).toBeInstanceOf(UrlTree);
    expect(value.toString()).toBe('/');
  });

  it('should redirect guests to /', async () => {
    setup({ ...initialAuthState, loading: false, user: null });
    const result = executeGuard({} as never, {} as never);
    const value = await firstValueFrom(result as Observable<boolean | UrlTree>);
    expect(value.toString()).toBe('/');
  });

  it('should wait while loading and then evaluate', async () => {
    const store = setup({
      ...initialAuthState,
      loading: true,
      user: null,
    });
    const results: (boolean | UrlTree)[] = [];
    const result = executeGuard({} as never, {} as never);
    (result as Observable<boolean | UrlTree>).subscribe((v) => results.push(v));
    expect(results).toHaveLength(0);

    store.setState({
      auth: {
        ...initialAuthState,
        loading: false,
        user: { id: 'u1', email: 'a@b.com', displayName: 'A', role: 'admin' },
      },
    });
    store.refreshState();

    await new Promise((resolve) => setTimeout(resolve));
    expect(results).toEqual([true]);
  });
});
