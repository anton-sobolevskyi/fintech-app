import { describe, expect, it } from 'vitest';
import { User } from '@core/models';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.models';
import { authReducer } from './auth.reducer';

const user: User = {
  id: 'user-1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'admin',
};

describe('authReducer', () => {
  it('should return the initial state by default', () => {
    const state = authReducer(undefined as never, { type: '@@INIT' } as never);
    expect(state).toEqual(initialAuthState);
  });

  it('should handle login by setting loading', () => {
    const state = authReducer(initialAuthState, AuthActions.login({ email: 'a@b.com', password: 'x' }));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loginSuccess', () => {
    const state = authReducer(initialAuthState, AuthActions.loginSuccess({ user }));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loginFailure', () => {
    const state = authReducer(initialAuthState, AuthActions.loginFailure({ error: 'nope' }));
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('nope');
  });

  it('should handle logoutSuccess by resetting to initial state', () => {
    const loggedIn = authReducer(initialAuthState, AuthActions.loginSuccess({ user }));
    const state = authReducer(loggedIn, AuthActions.logoutSuccess());
    expect(state).toEqual({ ...initialAuthState, sessionChecking: false });
  });

  it('should handle loadUserSuccess with a user', () => {
    const state = authReducer(initialAuthState, AuthActions.loadUserSuccess({ user }));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.sessionChecking).toBe(false);
  });

  it('should handle loadUserSuccess with a null user', () => {
    const state = authReducer(initialAuthState, AuthActions.loadUserSuccess({ user: null }));
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.sessionChecking).toBe(false);
  });

  it('should handle updateUserSuccess', () => {
    const updated = { ...user, displayName: 'Alice Updated' };
    const state = authReducer(initialAuthState, AuthActions.updateUserSuccess({ user: updated }));
    expect(state.user).toEqual(updated);
    expect(state.isAuthenticated).toBe(true);
    expect(state.sessionChecking).toBe(false);
  });

  it('should handle clearError', () => {
    const errored = authReducer(initialAuthState, AuthActions.loginFailure({ error: 'x' }));
    const state = authReducer(errored, AuthActions.clearError());
    expect(state.error).toBeNull();
  });

  it('should handle register by setting loading', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.register({ email: 'a@b.com', password: 'x', displayName: 'Bob' }),
    );
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle registerSuccess', () => {
    const state = authReducer(initialAuthState, AuthActions.registerSuccess({ user }));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle registerFailure', () => {
    const state = authReducer(initialAuthState, AuthActions.registerFailure({ error: 'nope' }));
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('nope');
  });
});