// features/accounts/accounts.store.ts
import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Account } from '@core/models';
import { AccountService } from '@core/services/account.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: AccountsState = {
  accounts: [],
  loading: false,
  saving: false,
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
          if (!user) return of([]);
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

    createAccount: rxMethod<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((data) => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return of(null);
          return accountService.create({
            ...data,
            userId: user.id,
            balance: 0,
            availableBalance: 0,
            status: 'active',
          });
        }),
        tapResponse({
          next: () => {
            patchState(store, { saving: false });
            // realtime onSnapshot will refresh the list automatically
          },
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to create account',
              saving: false,
            }),
        }),
      ),
    ),

    updateAccount: rxMethod<{ id: string; data: Partial<Account> }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ id, data }) => accountService.update(id, data)),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to update account',
              saving: false,
            }),
        }),
      ),
    ),

    deleteAccount: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((id) => accountService.delete(id)),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to delete account',
              saving: false,
            }),
        }),
      ),
    ),

    clearError: () => patchState(store, { error: null }),
  })),
);
