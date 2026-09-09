import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AccountsStore } from './accounts.store';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { EventService } from '@core/services/event.service';
import { initialAuthState } from '@core/store/auth/auth.models';
import { Account } from '@core/models';

function fakeAccount(partial: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    userId: 'user-1',
    name: 'Main',
    type: 'checking',
    currency: 'USD',
    balance: 100,
    availableBalance: 100,
    status: 'active',
    iban: 'UA123',
    createdAt: {} as never,
    ...partial,
  } as Account;
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('AccountsStore', () => {
  const accountService = { getByUserId: vi.fn() };
  const operationsService = {
    createAccount: vi.fn(),
    lookupByIban: vi.fn(),
    topUp: vi.fn(),
    transfer: vi.fn(),
  };
  const reportService = { create: vi.fn() };
  const eventService = { emit: vi.fn(), on: vi.fn().mockReturnValue(of(undefined)) };
  let mockStore: MockStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    accountService.getByUserId.mockReturnValue(of([]));
    operationsService.createAccount.mockReturnValue(
      of({ success: true, accountId: 'acc-1', iban: 'UA123' }),
    );
    operationsService.lookupByIban.mockReturnValue(of(null));
    operationsService.topUp.mockReturnValue(of({ accountId: 'acc-1', amount: 10 }));
    operationsService.transfer.mockReturnValue(of({ fromAccountId: 'a', toIban: 'UA1', amount: 5 }));
    reportService.create.mockReturnValue(of('report-1'));

    await TestBed.configureTestingModule({
      providers: [
        AccountsStore,
        provideMockStore({ initialState: { auth: { ...initialAuthState, user: { id: 'user-1' } } } }),
        { provide: AccountService, useValue: accountService },
        { provide: AccountOperationsService, useValue: operationsService },
        { provide: ReportService, useValue: reportService },
        { provide: EventService, useValue: eventService },
      ],
    }).compileComponents();
    mockStore = TestBed.inject(MockStore);
  });

  it('creates and triggers loadAccounts on init', () => {
    const store = TestBed.inject(AccountsStore);
    expect(store.accounts()).toEqual([]);
    expect(accountService.getByUserId).toHaveBeenCalledWith('user-1');
  });

  it('computes visibleAccounts excluding closed accounts', () => {
    const store = TestBed.inject(AccountsStore);
    accountService.getByUserId.mockReturnValue(
      of([fakeAccount({ id: 'a' }), fakeAccount({ id: 'b', status: 'closed' })]),
    );
    store.loadAccounts();
    expect(store.visibleAccounts().map((a) => a.id)).toEqual(['a']);
  });

  it('computes availableCurrencies excluding used currencies', () => {
    const store = TestBed.inject(AccountsStore);
    accountService.getByUserId.mockReturnValue(of([fakeAccount({ currency: 'USD' })]));
    store.loadAccounts();
    expect(store.availableCurrencies().some((c) => c.value === 'USD')).toBe(false);
    expect(store.availableCurrencies().some((c) => c.value === 'EUR')).toBe(true);
  });

  it('createAccount emits account.created event', async () => {
    const store = TestBed.inject(AccountsStore);
    store.createAccount({ name: 'n', type: 'checking', currency: 'USD' });
    await flush();
    expect(operationsService.createAccount).toHaveBeenCalled();
    expect(eventService.emit).toHaveBeenCalledWith(
      'account.created',
      expect.objectContaining({ accountId: 'acc-1' }),
    );
    expect(store.saving()).toBe(false);
  });

  it('lookupByIban sets recipient and error paths', async () => {
    const store = TestBed.inject(AccountsStore);
    const info = { holderName: 'John', bankName: 'Bank' };
    operationsService.lookupByIban.mockReturnValue(of(info));
    store.lookupByIban('UA111');
    await flush();
    expect(store.recipient()).toEqual(info);

    operationsService.lookupByIban.mockReturnValue(throwError(() => new Error('not found')));
    store.lookupByIban('UA222');
    await flush();
    expect(store.recipientError()).toBe('not found');
  });

  it('clearRecipient resets recipient state', () => {
    const store = TestBed.inject(AccountsStore);
    store.clearRecipient();
    expect(store.recipient()).toBeNull();
    expect(store.recipientLoading()).toBe(false);
  });

  it('topUp emits event and handles error', async () => {
    const store = TestBed.inject(AccountsStore);
    store.topUp({ accountId: 'acc-1', amount: 10 });
    await flush();
    expect(eventService.emit).toHaveBeenCalledWith(
      'account.topup',
      expect.objectContaining({ accountId: 'acc-1' }),
    );

    operationsService.topUp.mockReturnValueOnce(throwError(() => new Error('fail')));
    store.topUp({ accountId: 'acc-1', amount: 10 });
    await flush();
    expect(store.error()).toBe('fail');
  });

  it('transfer emits event and handles error', async () => {
    const store = TestBed.inject(AccountsStore);
    store.transfer({ fromAccountId: 'a', toIban: 'UA1', amount: 5 });
    await flush();
    expect(eventService.emit).toHaveBeenCalledWith('account.transfer', expect.anything());

    operationsService.transfer.mockReturnValueOnce(throwError(() => new Error('no funds')));
    store.transfer({ fromAccountId: 'a', toIban: 'UA1', amount: 5 });
    await flush();
    expect(store.error()).toBe('no funds');
  });

  it('generateReportForAccount calls report service and handles error', async () => {
    const store = TestBed.inject(AccountsStore);
    store.generateReportForAccount(fakeAccount());
    await flush();
    expect(reportService.create).toHaveBeenCalled();
    expect(store.saving()).toBe(false);

    reportService.create.mockReturnValueOnce(throwError(() => new Error('rep fail')));
    store.generateReportForAccount(fakeAccount());
    await flush();
    expect(store.error()).toBe('rep fail');
  });

  it('loadAccounts handles service error and clearError resets', async () => {
    const store = TestBed.inject(AccountsStore);
    accountService.getByUserId.mockReturnValue(throwError(() => new Error('load fail')));
    store.loadAccounts();
    await flush();
    expect(store.error()).toBe('load fail');
    expect(store.loading()).toBe(false);
    store.clearError();
    expect(store.error()).toBeNull();
  });

  it('createAccount sets error when not authenticated', async () => {
    mockStore.setState({ auth: { ...initialAuthState, user: null } });
    const store = TestBed.inject(AccountsStore);
    store.createAccount({ name: 'n', type: 'checking', currency: 'USD' });
    await flush();
    expect(store.error()).toBe('Not authenticated');
    expect(store.saving()).toBe(false);
  });

  it('generateReportForAccount sets error when not authenticated', async () => {
    mockStore.setState({ auth: { ...initialAuthState, user: null } });
    const store = TestBed.inject(AccountsStore);
    store.generateReportForAccount(fakeAccount());
    await flush();
    expect(store.error()).toBe('Not authenticated');
    expect(store.saving()).toBe(false);
  });

  it('uses fallback messages for errors without a message', async () => {
    const store = TestBed.inject(AccountsStore);
    const messageless = { code: 'ERR_NO_MESSAGE' };

    accountService.getByUserId.mockReturnValue(throwError(() => messageless));
    store.loadAccounts();
    await flush();
    expect(store.error()).toBe('Failed to load accounts');

    operationsService.createAccount.mockReturnValueOnce(throwError(() => messageless));
    store.createAccount({ name: 'n', type: 'checking', currency: 'USD' });
    await flush();
    expect(store.error()).toBe('Failed to create account');

    operationsService.lookupByIban.mockReturnValueOnce(throwError(() => messageless));
    store.lookupByIban('UA333');
    await flush();
    expect(store.recipientError()).toBe('No account found with this IBAN');

    operationsService.topUp.mockReturnValueOnce(throwError(() => messageless));
    store.topUp({ accountId: 'acc-1', amount: 10 });
    await flush();
    expect(store.error()).toBe('Failed to top up account');

    operationsService.transfer.mockReturnValueOnce(throwError(() => messageless));
    store.transfer({ fromAccountId: 'a', toIban: 'UA1', amount: 5 });
    await flush();
    expect(store.error()).toBe('Failed to transfer funds');

    reportService.create.mockReturnValueOnce(throwError(() => messageless));
    store.generateReportForAccount(fakeAccount());
    await flush();
    expect(store.error()).toBe('Failed to create report');
  });
});
