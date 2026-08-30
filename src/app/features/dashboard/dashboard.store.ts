import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Account, DataSource, Transaction } from '../../core/models';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import { DataSourceService } from '../../core/services/data-source.service';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';

interface DashboardState {
  accounts: Account[];
  transactions: Transaction[];
  sources: DataSource[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  accounts: [],
  transactions: [],
  sources: [],
  loading: false,
  error: null,
};

export const DashboardStore = signalStore(
  withState(initialState),

  withComputed(({ accounts, transactions, sources }) => ({
    totalBalance: computed(() => accounts().reduce((sum, acc) => sum + (acc.balance || 0), 0)),
    activeAccounts: computed(() => accounts().filter((a) => a.status === 'active').length),
    todayTransactionsCount: computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return transactions().filter((tx) => {
        const date = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt as any);
        return date >= today;
      }).length;
    }),
    pendingCount: computed(() => transactions().filter((t) => t.status === 'pending').length),
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
    healthySources: computed(() => sources().filter((s) => s.status === 'healthy').length),
    recentTransactions: computed(() =>
      [...transactions()]
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5),
    ),
  })),

  withMethods(
    (
      store,
      accountService = inject(AccountService),
      transactionService = inject(TransactionService),
      dataSourceService = inject(DataSourceService),
      globalStore = inject(Store),
    ) => ({
      loadDashboard: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() => {
            const user = globalStore.selectSignal(selectCurrentUser)();
            if (!user) {
              return of({ accounts: [], transactions: [], sources: [] });
            }

            return forkJoin({
              accounts: accountService.getByUserId(user.id),
              transactions: transactionService.getByUserId(user.id, 50),
              sources: dataSourceService.getAll(),
            });
          }),
          tapResponse({
            next: ({ accounts, transactions, sources }) =>
              patchState(store, {
                accounts,
                transactions,
                sources,
                loading: false,
              }),
            error: (err: any) =>
              patchState(store, {
                error: err.message || 'Failed to load dashboard',
                loading: false,
              }),
          }),
        ),
      ),
    }),
  ),
);
