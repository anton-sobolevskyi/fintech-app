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
import { Timestamp } from 'firebase/firestore';
import { Account, AccountType, Currency } from '@core/models';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService, AccountByIbanInfo } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { selectCurrentUser } from '@core/store/auth';
import { currencyOptions } from '@core/constants';

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  operating: boolean;
  recipient: AccountByIbanInfo | null;
  recipientLoading: boolean;
  recipientError: string | null;
}

const initialState: AccountsState = {
  accounts: [],
  loading: false,
  saving: false,
  error: null,
  operating: false,
  recipient: null,
  recipientLoading: false,
  recipientError: null,
};

export const AccountsStore = signalStore(
  withState(initialState),

  withComputed(({ accounts }) => ({
    visibleAccounts: computed(() => accounts().filter((a) => a.status !== 'closed')),
    availableCurrencies: computed(() =>
      currencyOptions.filter((option) => accounts().every((a) => a.currency !== option.value)),
    ),
  })),

  withMethods(
    (
      store,
      accountService = inject(AccountService),
      operationsService = inject(AccountOperationsService),
      reportService = inject(ReportService),
      globalStore = inject(Store),
    ) => ({
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

    createAccount: rxMethod<{ name: string; type: AccountType; currency: Currency }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ name, type, currency }) => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return throwError(() => new Error('Not authenticated'));

          return operationsService.createAccount({
            name,
            type,
            currency,
            balance: 0,
            availableBalance: 0,
            status: 'active',
          });
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

    lookupByIban: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { recipientLoading: true, recipientError: null, recipient: null })),
        switchMap((iban) => operationsService.lookupByIban(iban)),
        tapResponse({
          next: (recipient) => patchState(store, { recipient, recipientLoading: false }),
          error: (error: { message?: string; code?: string }) =>
            patchState(store, {
              recipientError: error.message || 'No account found with this IBAN',
              recipientLoading: false,
            }),
        }),
      ),
    ),

    clearRecipient: () =>
      patchState(store, { recipient: null, recipientError: null, recipientLoading: false }),

    topUp: rxMethod<{ accountId: string; amount: number }>(
      pipe(
        tap(() => patchState(store, { operating: true, error: null })),
        switchMap(({ accountId, amount }) => operationsService.topUp(accountId, amount)),
        tapResponse({
          next: () => patchState(store, { operating: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to top up account',
              operating: false,
            }),
        }),
      ),
    ),

    transfer: rxMethod<{ fromAccountId: string; toIban: string; amount: number }>(
      pipe(
        tap(() => patchState(store, { operating: true, error: null })),
        switchMap(({ fromAccountId, toIban, amount }) =>
          operationsService.transfer(fromAccountId, toIban, amount),
        ),
        tapResponse({
          next: () => patchState(store, { operating: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to transfer funds',
              operating: false,
            }),
        }),
      ),
    ),

    generateReportForAccount: rxMethod<Account>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((account) => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return throwError(() => new Error('Not authenticated'));

          const dateTo = Timestamp.now();
          const dateFrom = Timestamp.fromMillis(dateTo.toMillis() - 30 * 24 * 60 * 60 * 1000);

          return reportService.create({
            userId: user.id,
            title: `${account.name} statement`,
            type: 'transactions',
            status: 'generating',
            storagePath: '',
            filters: {
              dateFrom,
              dateTo,
              accountIds: [account.id],
              currencies: [account.currency],
            },
          });
        }),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (error: any) =>
            patchState(store, {
              error: error.message || 'Failed to create report',
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
