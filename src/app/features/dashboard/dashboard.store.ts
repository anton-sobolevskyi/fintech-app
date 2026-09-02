import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin, of, take } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Account, DataSource, Transaction } from '@core/models';
import { AccountService } from '@core/services/account.service';
import { DataSourceService } from '@core/services/data-source.service';
import { TransactionService } from '@core/services/transaction.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';

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

function txDate(tx: Transaction): Date {
  if (!tx.createdAt) return new Date(0);
  return tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt as any);
}

export const DashboardStore = signalStore(
  withState(initialState),

  withComputed(({ accounts, transactions, sources }) => ({
    totalBalance: computed(() => accounts().reduce((sum, acc) => sum + (acc.balance || 0), 0)),
    activeAccounts: computed(() => accounts().filter((a) => a.status === 'active').length),
    todayTransactionsCount: computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return transactions().filter((tx) => txDate(tx) >= today).length;
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
      [...transactions()].sort((a, b) => txDate(b).getTime() - txDate(a).getTime()).slice(0, 6),
    ),

    cashFlowChart: computed(() => {
      const days: { label: string; income: number; expense: number }[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const next = new Date(d);
        next.setDate(d.getDate() + 1);

        const dayTx = transactions().filter((tx) => {
          const date = txDate(tx);
          return date >= d && date < next;
        });

        days.push({
          label: d.toLocaleDateString('uk-UA', { weekday: 'short' }),
          income: dayTx.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
          expense: dayTx
            .filter((t) => t.type === 'debit' || t.type === 'fee')
            .reduce((s, t) => s + t.amount, 0),
        });
      }

      return {
        labels: days.map((d) => d.label),
        datasets: [
          {
            label: 'Income',
            data: days.map((d) => d.income),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Expenses',
            data: days.map((d) => d.expense),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: false,
          },
        ],
      };
    }),
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
              accounts: accountService.getByUserId(user.id).pipe(take(1)),
              transactions: transactionService.getByUserId(user.id, 100).pipe(take(1)),
              sources: dataSourceService.getAllSources
                ? dataSourceService.getAllSources().pipe(take(1))
                : dataSourceService.getAll().pipe(take(1)),
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
