import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { DashboardStore } from './dashboard.store';
import { AccountService } from '@core/services/account.service';
import { TransactionService } from '@core/services/transaction.service';
import { EventService } from '@core/services/event.service';
import { initialAuthState } from '@core/store/auth/auth.models';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('DashboardStore', () => {
  const accountService = { getByUserId: vi.fn() };
  const txService = { getByUserId: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    accountService.getByUserId.mockReturnValue(of([]));
    txService.getByUserId.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        provideMockStore({ initialState: { auth: { ...initialAuthState, user: { id: 'u1' } } } }),
        { provide: AccountService, useValue: accountService },
        { provide: TransactionService, useValue: txService },
        { provide: EventService, useValue: { on: () => of(undefined) } },
      ],
    }).compileComponents();
  });

  it('loads dashboard on init', () => {
    TestBed.inject(DashboardStore);
    expect(accountService.getByUserId).toHaveBeenCalledWith('u1');
    expect(txService.getByUserId).toHaveBeenCalledWith('u1', 100);
  });

  it('computes balancesByCurrency', async () => {
    const store = TestBed.inject(DashboardStore);
    accountService.getByUserId.mockReturnValue(
      of([
        { id: 'a', currency: 'USD', balance: 100 },
        { id: 'b', currency: 'USD', balance: 50 },
        { id: 'c', currency: 'EUR', balance: 20 },
      ]),
    );
    store.loadDashboard();
    await flush();
    const balances = store.balancesByCurrency();
    expect(balances).toContainEqual({ currency: 'USD', balance: 150 });
    expect(balances).toContainEqual({ currency: 'EUR', balance: 20 });
  });

  it('computes recentTransactions sorted desc limited to 10', async () => {
    const store = TestBed.inject(DashboardStore);
    const mk = (id: string, seconds: number) =>
      ({ id, createdAt: { toDate: () => new Date(seconds * 1000) } }) as never;
    const txs = Array.from({ length: 12 }, (_, i) => mk(`t${i}`, 1000 + i));
    txService.getByUserId.mockReturnValue(of(txs));
    store.loadDashboard();
    await flush();
    expect(store.recentTransactions().length).toBe(10);
    expect(store.recentTransactions()[0].id).toBe('t11');
  });

  it('computes cashFlowChart with 7 labels and 2 datasets', async () => {
    const store = TestBed.inject(DashboardStore);
    const now = new Date();
    const mkToday = (id: string, type: 'credit' | 'debit', amount: number) =>
      ({ id, type, amount, createdAt: { toDate: () => now } }) as never;
    txService.getByUserId.mockReturnValue(of([mkToday('a', 'credit', 30), mkToday('b', 'debit', 12)]));
    store.loadDashboard();
    await flush();
    const chart = store.cashFlowChart();
    expect(chart.labels.length).toBe(7);
    expect(chart.datasets.length).toBe(2);
    expect(chart.datasets[0].data.reduce((s: number, v: number) => s + v, 0)).toBe(30);
    expect(chart.datasets[1].data.reduce((s: number, v: number) => s + v, 0)).toBe(12);
  });

  it('handles no-user case', async () => {
    const { MockStore } = await import('@ngrx/store/testing');
    TestBed.inject(DashboardStore);
    const mockStore = TestBed.inject(MockStore);
    mockStore.setState({ auth: { ...initialAuthState, user: null } });
    const store = TestBed.inject(DashboardStore);
    store.loadDashboard();
    await flush();
    expect(store.loading()).toBe(false);
  });

  it('handles load error', async () => {
    const store = TestBed.inject(DashboardStore);
    accountService.getByUserId.mockReturnValue(throwError(() => new Error('dash fail')));
    store.loadDashboard();
    await flush();
    expect(store.error()).toBe('dash fail');
    expect(store.loading()).toBe(false);
  });
});
