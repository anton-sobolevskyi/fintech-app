import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';
import { selectIsAuthenticated, selectSessionChecking } from '../store/auth/auth.selectors';

export const guestGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([
    store.select(selectIsAuthenticated),
    store.select(selectSessionChecking),
  ]).pipe(
    filter(([_, loading]) => !loading),
    take(1),
    map(([isAuthenticated]) => {
      if (isAuthenticated) {
        return router.createUrlTree(['/']);
      }

      return true;
    }),
  );
};
