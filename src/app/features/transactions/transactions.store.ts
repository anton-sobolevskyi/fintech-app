import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Transaction } from '../../core/models';
import { TransactionService } from '../../core/services/transaction.service';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  pageSize: number;
}

const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  error: null,
  lastDoc: null,
  hasMore: false,
  pageSize: 20,
};

export const TransactionsStore = signalStore(
  withState(initialState),

  withComputed(({ transactions }) => ({
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
  })),

  withMethods(
    (store, transactionService = inject(TransactionService), globalStore = inject(Store)) => ({
      loadTransactions: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null, lastDoc: null })),
          switchMap(() => {
            const user = globalStore.selectSignal(selectCurrentUser)();
            if (!user) return of({ items: [], lastDoc: null, hasMore: false });

            return transactionService.getByUserIdPaginated(user.id, store.pageSize());
          }),
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
          switchMap(() => {
            const user = globalStore.selectSignal(selectCurrentUser)();
            if (!user || !store.lastDoc()) {
              return of({ items: [], lastDoc: null, hasMore: false });
            }

            return transactionService.getByUserIdPaginated(
              user.id,
              store.pageSize(),
              store.lastDoc(),
            );
          }),
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
    }),
  ),
);
