import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, debounceTime, distinctUntilChanged } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Transaction } from '../../core/models';
import { TransactionService } from '../../core/services/transaction.service';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';

export interface TransactionFilters {
  search: string;
  type: string | null;
  status: string | null;
  accountId: string | null;
}

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  pageSize: number;
  filters: TransactionFilters;
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
  error: null,
  lastDoc: null,
  hasMore: false,
  pageSize: 20,
  filters: initialFilters,
};

export const TransactionsStore = signalStore(
  withState(initialState),

  withComputed(({ transactions, filters }) => ({
    totalIncome: computed(() =>
      transactions()
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    totalExpense: computed(() =>
      transactions()
        .filter((t) => t.type === 'debit' || t.type === 'fee')
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    count: computed(() => transactions().length),

    filteredTransactions: computed(() => {
      const search = filters().search.toLowerCase().trim();
      if (!search) return transactions();

      return transactions().filter((tx) =>
        tx.description?.toLowerCase().includes(search) ||
        tx.counterpartyName?.toLowerCase().includes(search) ||
        tx.category?.toLowerCase().includes(search)
      );
    }),
  })),

  withMethods(
    (store, transactionService = inject(TransactionService), globalStore = inject(Store)) => {
      const load = (reset = true) => {
        const user = globalStore.selectSignal(selectCurrentUser)();
        if (!user) return of({ items: [], lastDoc: null, hasMore: false });

        const { type, status, accountId } = store.filters();

        return transactionService.getByUserIdPaginated(
          user.id,
          store.pageSize(),
          reset ? null : store.lastDoc()
        );
      };

      return {
        setFilter: (partial: Partial<TransactionFilters>) => {
          patchState(store, {
            filters: { ...store.filters(), ...partial },
          });
        },

        resetFilters: () => {
          patchState(store, { filters: initialFilters });
        },

        loadTransactions: rxMethod<void>(
          pipe(
            tap(() =>
              patchState(store, {
                loading: true,
                error: null,
                lastDoc: null,
                transactions: [],
              })
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
            })
          )
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
            })
          )
        ),

        applyFilters: rxMethod<void>(
          pipe(
            debounceTime(300),
            distinctUntilChanged(),
            tap(() =>
              patchState(store, {
                loading: true,
                error: null,
                lastDoc: null,
                transactions: [],
              })
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
            })
          )
        ),
      };
    }
  )
);
