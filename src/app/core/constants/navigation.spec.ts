import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, expect, it, vi } from 'vitest';
import { AuthActions } from '@core/store/auth/auth.actions';
import { sidebarNavigation, userBlockNavigation } from './navigation';

describe('navigation constants', () => {
  describe('userBlockNavigation', () => {
    let store: Store;
    let router: Router;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideMockStore({})],
      });
      store = TestBed.inject(Store);
      router = TestBed.inject(Router);
    });

    it('should return a menu with the user email disabled first', () => {
      const items = userBlockNavigation('a@b.com', store, router);
      expect(items[0]).toEqual({ label: 'a@b.com', disabled: true });
      expect(items.some((i) => i.separator)).toBe(true);
    });

    it('should have a profile entry and a settings entry', () => {
      const items = userBlockNavigation('a@b.com', store, router);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('Profile');
      expect(labels).toContain('Settings');
      expect(labels).toContain('Sign Out');
    });

    it('should navigate to /settings from the Settings command', () => {
      const items = userBlockNavigation('a@b.com', store, router);
      const settings = items.find((i) => i.label === 'Settings');
      const navigateSpy = vi.spyOn(router, 'navigate');
      settings!.command!({} as never);
      expect(navigateSpy).toHaveBeenCalledWith(['/settings']);
    });

    it('should dispatch logout from the Sign Out command', () => {
      const items = userBlockNavigation('a@b.com', store, router);
      const signOut = items.find((i) => i.label === 'Sign Out');
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      signOut!.command!({} as never);
      expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.logout());
    });
  });

  describe('sidebarNavigation', () => {
    it('should show admin-only items for admins', () => {
      const items = sidebarNavigation('admin');
      expect(items.map((i) => i.routerLink)).toContain('/users');
      expect(items.map((i) => i.routerLink)).toContain('/transactions');
      const users = items.find((i) => i.routerLink === '/users');
      const transactions = items.find((i) => i.routerLink === '/transactions');
      expect(users!.visible).toBe(true);
      expect(transactions!.visible).toBe(true);
    });

    it('should hide admin-only items for clients', () => {
      const items = sidebarNavigation('client');
      const users = items.find((i) => i.routerLink === '/users');
      const transactions = items.find((i) => i.routerLink === '/transactions');
      expect(users!.visible).toBe(false);
      expect(transactions!.visible).toBe(false);
    });

    it('should always include Dashboard and Accounts', () => {
      for (const role of ['admin', 'client', 'viewer', 'manager', 'analyst'] as const) {
        const items = sidebarNavigation(role);
        expect(items.map((i) => i.routerLink)).toContain('/');
        expect(items.map((i) => i.routerLink)).toContain('/accounts');
      }
    });
  });
});