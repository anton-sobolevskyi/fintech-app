import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { selectAuthLoading, selectCurrentUser } from '@core/store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([store.select(selectCurrentUser), store.select(selectAuthLoading)]).pipe(
    filter(([_, loading]) => !loading),
    take(1),
    map(([user]) => {
      if (user?.role === 'admin') return true;
      return router.createUrlTree(['/']);
    }),
  );
};
