import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Account, Transaction } from '@core/models';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { TransactionService } from '@core/services/transaction.service';
import { AccountService } from '@core/services/account.service';

export interface TransactionFilters {
  search: string;
  type: string | null;
  status: string | null;
  accountId: string | null;
}

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  pageSize: number;
  filters: TransactionFilters;
  accounts: Account[];
}

const initialFilters: TransactionFilters = {
  search: '',
  type: null,
  status: null,
  accountId: null,
};

const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  saving: false,
  error: null,
  lastDoc: null,
  hasMore: false,
  pageSize: 20,
  filters: initialFilters,
  accounts: [],
};

export const TransactionsStore = signalStore(
  withState(initialState),

  withComputed(({ transactions, filters, accounts }) => ({
    totalIncome: computed(() =>
      transactions()
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
    ),
    totalExpense: computed(() =>
      transactions()
        .filter((t) => t.type === 'debit' || t.type === 'fee')
        .reduce((sum, t) => sum + t.amount, 0),
    ),
    count: computed(() => transactions().length),

    filteredTransactions: computed(() => {
      const search = filters().search.toLowerCase().trim();
      if (!search) return transactions();

      return transactions().filter(
        (tx) =>
          tx.description?.toLowerCase().includes(search) ||
          tx.counterpartyName?.toLowerCase().includes(search) ||
          tx.category?.toLowerCase().includes(search),
      );
    }),

    accountOptions: computed(() => [
      { label: 'All Accounts', value: null },
      ...accounts().map((a) => ({
        label: `${a.name} (${a.currency})`,
        value: a.id,
      })),
    ]),
  })),

  withMethods(
    (
      store,
      transactionService = inject(TransactionService),
      globalStore = inject(Store),
      accountService = inject(AccountService),
    ) => {
      const load = (reset = true) => {
        const user = globalStore.selectSignal(selectCurrentUser)();
        if (!user) return of({ items: [], lastDoc: null, hasMore: false });

        const { type, status, accountId } = store.filters();

        return transactionService.getByUserIdPaginated(
          user.id,
          store.pageSize(),
          reset ? null : store.lastDoc(),
          { type, status, accountId },
        );
      };

      return {
        setFilter: (partial: Partial<TransactionFilters>) => {
          patchState(store, {
            filters: { ...store.filters(), ...partial },
          });
        },

        resetFilters: () => {
          patchState(store, { filters: { ...initialFilters } });
        },

        loadTransactions: rxMethod<void>(
          pipe(
            tap(() =>
              patchState(store, {
                loading: true,
                error: null,
                lastDoc: null,
                transactions: [],
              }),
            ),
            switchMap(() => load(true)),
            tapResponse({
              next: (result) =>
                patchState(store, {
                  transactions: result.items,
                  lastDoc: result.lastDoc,
                  hasMore: result.hasMore,
                  loading: false,
                }),
              error: (err: any) =>
                patchState(store, {
                  error: err.message || 'Failed to load transactions',
                  loading: false,
                }),
            }),
          ),
        ),

        loadMore: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true })),
            switchMap(() => load(false)),
            tapResponse({
              next: (result) =>
                patchState(store, {
                  transactions: [...store.transactions(), ...result.items],
                  lastDoc: result.lastDoc,
                  hasMore: result.hasMore,
                  loading: false,
                }),
              error: (err: any) =>
                patchState(store, {
                  error: err.message || 'Failed to load more',
                  loading: false,
                }),
            }),
          ),
        ),

        applyFilters: rxMethod<void>(
          pipe(
            tap(() =>
              patchState(store, {
                loading: true,
                error: null,
                lastDoc: null,
                transactions: [],
              }),
            ),
            switchMap(() => load(true)),
            tapResponse({
              next: (result) =>
                patchState(store, {
                  transactions: result.items,
                  lastDoc: result.lastDoc,
                  hasMore: result.hasMore,
                  loading: false,
                }),
              error: (err: any) =>
                patchState(store, {
                  error: err.message || 'Failed to apply filters',
                  loading: false,
                }),
            }),
          ),
        ),

        createTransaction: rxMethod<Omit<Transaction, 'id' | 'createdAt' | 'processedAt'>>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((data) => {
              const user = globalStore.selectSignal(selectCurrentUser)();
              if (!user) return of(null);
              return transactionService.create({ ...data, userId: user.id });
            }),
            tapResponse({
              next: () => {
                patchState(store, { saving: false });
                // reload first page with current filters
              },
              error: (err: any) =>
                patchState(store, {
                  error: err.message || 'Failed to create transaction',
                  saving: false,
                }),
            }),
          ),
        ),

        updateTransaction: rxMethod<{ id: string; data: Partial<Transaction> }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap(({ id, data }) => transactionService.update(id, data)),
            tapResponse({
              next: () => patchState(store, { saving: false }),
              error: (err: any) =>
                patchState(store, {
                  error: err.message || 'Failed to update transaction',
                  saving: false,
                }),
            }),
          ),
        ),

        deleteTransaction: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((id) => transactionService.delete(id)),
            tapResponse({
              next: (deletedId) =>
                patchState(store, {
                  transactions: store.transactions().filter((t) => t.id !== deletedId),
                  saving: false,
                }),
              error: (err: any) =>
                patchState(store, {
                  error: err.message || 'Failed to delete transaction',
                  saving: false,
                }),
            }),
          ),
        ),

        loadAccounts: rxMethod<void>(
          pipe(
            switchMap(() => {
              const user = globalStore.selectSignal(selectCurrentUser)();
              if (!user) return of([]);
              return accountService.getByUserId(user.id);
            }),
            tapResponse({
              next: (accounts) => patchState(store, { accounts }),
              error: () => patchState(store, { accounts: [] }),
            }),
          ),
        ),
      };
    },
  ),
);
