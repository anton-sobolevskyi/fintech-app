import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TransactionsStore } from './transactions.store';
import { TransactionService } from '@core/services/transaction.service';
import { AccountService } from '@core/services/account.service';
import { initialAuthState } from '@core/store/auth/auth.models';
import { Transaction } from '@core/models';

export function fakeTx(partial: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'acc-1',
    type: 'credit',
    status: 'completed',
    amount: 50,
    currency: 'USD',
    description: 'Coffee shop payment',
    category: 'Food',
    counterpartyName: 'Starbucks',
    ...partial,
  } as Transaction;
}

export const flushTx = () => new Promise<void>((r) => setTimeout(r, 0));

export const txService = {
  getByUserIdPaginated: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
export const txAccountService = { getByUserId: vi.fn() };

export async function setupTxStore(): Promise<MockStore> {
  vi.clearAllMocks();
  txService.getByUserIdPaginated.mockReturnValue(of({ items: [], lastDoc: null, hasMore: false }));
  txService.create.mockReturnValue(of('tx-new'));
  txService.update.mockReturnValue(of(null));
  txService.delete.mockReturnValue(of('tx-1'));
  txAccountService.getByUserId.mockReturnValue(of([]));

  await TestBed.configureTestingModule({
    providers: [
      TransactionsStore,
      provideMockStore({ initialState: { auth: { ...initialAuthState, user: { id: 'user-1' } } } }),
      { provide: TransactionService, useValue: txService },
      { provide: AccountService, useValue: txAccountService },
    ],
  }).compileComponents();
  return TestBed.inject(MockStore);
}

describe('TransactionsStore basics', () => {
  beforeEach(setupTxStore);

  it('creates with initial state', () => {
    const store = TestBed.inject(TransactionsStore);
    expect(store.transactions()).toEqual([]);
    expect(store.pageSize()).toBe(20);
  });

  it('computes totals, count and filtered transactions', () => {
    const store = TestBed.inject(TransactionsStore);
    txService.getByUserIdPaginated.mockReturnValue(
      of({
        items: [
          fakeTx({ id: 'a', type: 'credit', amount: 100 }),
          fakeTx({ id: 'b', type: 'debit', amount: 40 }),
          fakeTx({ id: 'c', type: 'fee', amount: 10 }),
        ],
        lastDoc: null,
        hasMore: false,
      }),
    );
    store.loadTransactions();
    expect(store.totalIncome()).toBe(100);
    expect(store.totalExpense()).toBe(50);
    expect(store.count()).toBe(3);

    store.setFilter({ search: 'starbucks' });
    expect(store.filteredTransactions().length).toBe(3);
    store.setFilter({ search: 'zzz-no-match' });
    expect(store.filteredTransactions()).toEqual([]);
  });

  it('computes accountOptions from accounts', () => {
    const store = TestBed.inject(TransactionsStore);
    txAccountService.getByUserId.mockReturnValue(
      of([{ id: 'acc-1', name: 'Main', currency: 'USD' }]),
    );
    store.loadAccounts();
    expect(store.accountOptions()).toEqual([
      { label: 'All Accounts', value: null },
      { label: 'Main (USD)', value: 'acc-1' },
    ]);
  });
});

describe('TransactionsStore rxMethods', () => {
  beforeEach(setupTxStore);
  it('loadTransactions loads paginated result', async () => {
    const { throwError } = await import('rxjs');
    const store = TestBed.inject(TransactionsStore);
    txService.getByUserIdPaginated.mockReturnValue(
      of({ items: [fakeTx()], lastDoc: 'doc' as never, hasMore: true }),
    );
    store.loadTransactions();
    await flushTx();
    expect(store.transactions().length).toBe(1);
    expect(store.hasMore()).toBe(true);

    txService.getByUserIdPaginated.mockReturnValue(throwError(() => new Error('load fail')));
    store.loadTransactions();
    await flushTx();
    expect(store.error()).toBe('load fail');
  });

  it('loadMore appends items and handles error', async () => {
    const { throwError } = await import('rxjs');
    const store = TestBed.inject(TransactionsStore);
    txService.getByUserIdPaginated.mockReturnValue(
      of({ items: [fakeTx({ id: 'n1' })], lastDoc: null, hasMore: false }),
    );
    store.loadMore();
    await flushTx();
    expect(store.transactions().length).toBe(1);

    txService.getByUserIdPaginated.mockReturnValueOnce(throwError(() => new Error('more fail')));
    store.loadMore();
    await flushTx();
    expect(store.error()).toBe('more fail');
  });

  it('setFilter / resetFilters / applyFilters work', async () => {
    const store = TestBed.inject(TransactionsStore);
    store.setFilter({ type: 'credit', status: 'completed', accountId: 'acc-1' });
    expect(store.filters().type).toBe('credit');
    store.applyFilters();
    await flushTx();
    expect(txService.getByUserIdPaginated).toHaveBeenCalled();
    store.resetFilters();
    expect(store.filters()).toEqual({ search: '', type: null, status: null, accountId: null });
  });

  it('create/update/delete success and error paths', async () => {
    const { throwError } = await import('rxjs');
    const store = TestBed.inject(TransactionsStore);
    store.createTransaction({ amount: 10 } as never);
    await flushTx();
    expect(store.saving()).toBe(false);

    txService.create.mockReturnValueOnce(throwError(() => new Error('create fail')));
    store.createTransaction({ amount: 10 } as never);
    await flushTx();
    expect(store.error()).toBe('create fail');

    store.updateTransaction({ id: 'tx-1', data: { amount: 20 } });
    await flushTx();
    expect(txService.update).toHaveBeenCalled();

    txService.update.mockReturnValueOnce(throwError(() => new Error('update fail')));
    store.updateTransaction({ id: 'tx-1', data: { amount: 20 } });
    await flushTx();
    expect(store.error()).toBe('update fail');

    txService.delete.mockReturnValue(of('tx-1'));
    txService.getByUserIdPaginated.mockReturnValue(
      of({ items: [fakeTx({ id: 'tx-1' })], lastDoc: null, hasMore: false }),
    );
    store.loadTransactions();
    await flushTx();
    store.deleteTransaction('tx-1');
    await flushTx();
    expect(store.transactions()).toEqual([]);

    txService.delete.mockReturnValueOnce(throwError(() => new Error('delete fail')));
    store.deleteTransaction('tx-1');
    await flushTx();
    expect(store.error()).toBe('delete fail');
  });

  it('loadAccounts ok and error paths', async () => {
    const { throwError } = await import('rxjs');
    const store = TestBed.inject(TransactionsStore);
    txAccountService.getByUserId.mockReturnValue(of([{ id: 'a' } as never]));
    store.loadAccounts();
    await flushTx();
    expect(store.accounts().length).toBe(1);

    txAccountService.getByUserId.mockReturnValueOnce(throwError(() => new Error('acc fail')));
    store.loadAccounts();
    await flushTx();
    expect(store.accounts()).toEqual([]);
  });

  it('uses fallback messages for errors without a message', async () => {
    const store = TestBed.inject(TransactionsStore);
    const messageless = { code: 'ERR_NO_MESSAGE' };

    txService.getByUserIdPaginated.mockReturnValueOnce(throwError(() => messageless));
    store.loadTransactions();
    await flushTx();
    expect(store.error()).toBe('Failed to load transactions');

    txService.getByUserIdPaginated.mockReturnValueOnce(throwError(() => messageless));
    store.loadMore();
    await flushTx();
    expect(store.error()).toBe('Failed to load more');

    txService.getByUserIdPaginated.mockReturnValueOnce(throwError(() => messageless));
    store.applyFilters();
    await flushTx();
    expect(store.error()).toBe('Failed to apply filters');

    txService.create.mockReturnValueOnce(throwError(() => messageless));
    store.createTransaction({ amount: 10 } as never);
    await flushTx();
    expect(store.error()).toBe('Failed to create transaction');

    txService.update.mockReturnValueOnce(throwError(() => messageless));
    store.updateTransaction({ id: 'tx-1', data: { amount: 20 } });
    await flushTx();
    expect(store.error()).toBe('Failed to update transaction');

    txService.delete.mockReturnValueOnce(throwError(() => messageless));
    store.deleteTransaction('tx-1');
    await flushTx();
    expect(store.error()).toBe('Failed to delete transaction');
  });
});
