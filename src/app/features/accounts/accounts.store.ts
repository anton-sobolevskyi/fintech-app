import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, throwError } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Account, Currency } from '@core/models';
import { AccountService } from '@core/services/account.service';
import { selectCurrentUser } from '@core/store/auth';
import { currencyOptions } from '@core/constants';

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
    visibleAccounts: computed(() => accounts().filter((a) => a.status !== 'closed')),
    availableCurrencies: computed(() =>
      currencyOptions.filter((option) => accounts().every((a) => a.currency !== option.value)),
    ),
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

    createAccount: rxMethod<{ currency: Currency }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ currency }) => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return throwError(() => new Error('Not authenticated'));

          const taken = store
            .accounts()
            .some((a) => a.currency === currency && a.status !== 'closed');
          if (taken) {
            return throwError(() => new Error(`Account in ${currency} already exists`));
          }

          return accountService.createWithUniqueIban({
            userId: user.id,
            name: `Checking · ${currency}`,
            type: 'checking',
            currency,
            balance: 0,
            availableBalance: 0,
            status: 'active',
          } as Omit<Account, 'id' | 'createdAt' | 'iban'>);
        }),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to create account',
              saving: false,
            }),
        }),
      ),
    ),

    clearError: () => patchState(store, { error: null }),
  })),

  withHooks({
    onInit: (store) => {
      store.loadAccounts();
    },
  }),
);
