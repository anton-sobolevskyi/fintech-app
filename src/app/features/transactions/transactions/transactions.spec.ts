import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Transactions } from './transactions';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { TransactionService } from '@core/services/transaction.service';
import { AccountService } from '@core/services/account.service';
import { of } from 'rxjs';

describe('Transactions', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        {
          provide: TransactionService,
          useValue: {
            getByUserIdPaginated: () => of({ items: [], lastDoc: null, hasMore: false }),
            create: () => of('id'),
            update: () => of(null),
            delete: () => of('id'),
          },
        },
        { provide: AccountService, useValue: { getByUserId: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadTransactions and loadAccounts on init', () => {
    const txSpy = vi.spyOn(component.store, 'loadTransactions');
    const accSpy = vi.spyOn(component.store, 'loadAccounts');
    component.ngOnInit();
    expect(txSpy).toHaveBeenCalled();
    expect(accSpy).toHaveBeenCalled();
  });

  it('should delegate loadMore and search/type/status/account filters', () => {
    const moreSpy = vi.spyOn(component.store, 'loadMore');
    component.loadMore();
    expect(moreSpy).toHaveBeenCalled();
    const setSpy = vi.spyOn(component.store, 'setFilter');
    const applySpy = vi.spyOn(component.store, 'applyFilters');
    component.onSearch('coffee');
    expect(setSpy).toHaveBeenCalledWith({ search: 'coffee' });
    component.onTypeChange('credit');
    expect(setSpy).toHaveBeenCalledWith({ type: 'credit' });
    expect(applySpy).toHaveBeenCalled();
    component.onStatusChange('completed');
    expect(setSpy).toHaveBeenCalledWith({ status: 'completed' });
    component.onAccountChange('acc-1');
    expect(setSpy).toHaveBeenCalledWith({ accountId: 'acc-1' });
  });

  it('should clear filters and reload', () => {
    const resetSpy = vi.spyOn(component.store, 'resetFilters');
    const loadSpy = vi.spyOn(component.store, 'loadTransactions');
    component.clearFilters();
    expect(resetSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should open create and edit dialogs', () => {
    component.openCreate();
    expect(component.editingTx()).toBeNull();
    expect(component.showDialog()).toBe(true);
    const tx = { id: 'tx-1' } as never;
    component.openEdit(tx);
    expect(component.editingTx()).toBe(tx);
    expect(component.showDialog()).toBe(true);
  });

  it('should save via update when editing, create otherwise', () => {
    const updateSpy = vi.spyOn(component.store, 'updateTransaction');
    const createSpy = vi.spyOn(component.store, 'createTransaction');
    const loadSpy = vi.spyOn(component.store, 'loadTransactions');
    component.editingTx.set({ id: 'tx-1' } as never);
    component.onSave({ amount: 5 } as never);
    expect(updateSpy).toHaveBeenCalledWith({ id: 'tx-1', data: { amount: 5 } as never });
    expect(component.showDialog()).toBe(false);

    component.editingTx.set(null);
    component.onSave({ amount: 7 } as never);
    expect(createSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should confirm and delete transaction', () => {
    const delSpy = vi.spyOn(component.store, 'deleteTransaction');
    let accepted: (() => void) | undefined;
    vi.spyOn(
      (component as unknown as { confirmation: { confirm: (opts: unknown) => void } })
        .confirmation,
      'confirm',
    ).mockImplementation((opts: unknown) => {
      accepted = (opts as { accept: () => void }).accept;
    });
    const tx = { id: 'tx-9', description: 'Test' } as never;
    component.onDelete(tx);
    accepted?.();
    expect(delSpy).toHaveBeenCalledWith('tx-9');
  });

  it('should map type and status severities', () => {
    expect(component.getTypeSeverity('credit')).toBe('success');
    expect(component.getTypeSeverity('debit')).toBe('danger');
    expect(component.getTypeSeverity('transfer')).toBe('info');
    expect(component.getTypeSeverity('fee')).toBe('warn');
    expect(component.getTypeSeverity('other' as never)).toBe('info');
    expect(component.getStatusSeverity('completed')).toBe('success');
    expect(component.getStatusSeverity('pending')).toBe('warn');
    expect(component.getStatusSeverity('failed')).toBe('danger');
    expect(component.getStatusSeverity('reversed')).toBe('info');
    expect(component.getStatusSeverity('other' as never)).toBe('info');
  });

  it('should format currency and dates', () => {
    expect(component.formatCurrency(10, 'USD')).toContain('10');
    expect(component.formatDate(undefined)).toBe('');
    expect(component.formatDate(new Date('2024-05-01T10:00:00'))).toContain('2024');
    expect(
      component.formatDate({ toDate: () => new Date('2024-05-02T10:00:00') } as never),
    ).toContain('2024');
  });

  it('should render summary cards, filters and table', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Transactions');
    expect(text).toContain('Income');
    expect(text).toContain('Expenses');
    expect(text).toContain('No transactions found');
  });

  it('should render transaction rows', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, {
      transactions: [
        {
          id: 'tx-1',
          description: 'Coffee',
          counterpartyName: 'Starbucks',
          type: 'credit',
          status: 'completed',
          amount: 50,
          currency: 'USD',
          createdAt: new Date('2024-05-01T10:00:00'),
        },
      ],
      lastDoc: 'doc',
      hasMore: true,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Coffee');
    expect(text).toContain('Starbucks');
    expect(component.store.hasMore()).toBe(true);
    expect(component.store.transactions().length).toBe(1);
  });
});
