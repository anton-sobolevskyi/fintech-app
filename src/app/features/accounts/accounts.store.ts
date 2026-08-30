import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Account } from '../../core/models';
import { AccountService } from '../../core/services/account.service';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
}

const initialState: AccountsState = {
  accounts: [],
  loading: false,
  error: null,
};

export const AccountsStore = signalStore(
  withState(initialState),

  withComputed(({ accounts }) => ({
    totalBalance: computed(() => accounts().reduce((sum, acc) => sum + (acc.balance || 0), 0)),
    activeCount: computed(() => accounts().filter((a) => a.status === 'active').length),
    accountsCount: computed(() => accounts().length),
  })),

  withMethods((store, accountService = inject(AccountService), globalStore = inject(Store)) => ({
    loadAccounts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) {
            return of([]);
          }
          return accountService.getByUserId(user.id);
        }),
        tapResponse({
          next: (accounts) => patchState(store, { accounts, loading: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to load accounts',
              loading: false,
            }),
        }),
      ),
    ),
  })),
);
