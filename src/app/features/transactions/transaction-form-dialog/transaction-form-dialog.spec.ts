import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { TransactionFormDialog } from './transaction-form-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { Account } from '@core/models';
import { of } from 'rxjs';

describe('TransactionFormDialog', () => {
  let component: TransactionFormDialog;
  let fixture: ComponentFixture<TransactionFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionFormDialog],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        { provide: AccountService, useValue: { getByUserId: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit visibleChange on hide', () => {
    const spy = vi.spyOn(component.visibleChange, 'emit');
    (component as unknown as { onHide: () => void }).onHide();
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should compute account options from loaded accounts', () => {
    (
      component as unknown as { accounts: { set: (v: unknown[]) => void } }
    ).accounts.set([
      { id: 'a1', name: 'Main', currency: 'USD' },
      { id: 'a2', name: 'Euro', currency: 'EUR' },
    ]);
    const opts = component.accountOptions();
    expect(opts).toEqual([
      { label: 'Main (USD)', value: 'a1' },
      { label: 'Euro (EUR)', value: 'a2' },
    ]);
  });

  it('should emit visibleChange on hide via onHide', () => {
    const spy = vi.spyOn(component.visibleChange, 'emit');
    component.onHide();
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should load accounts for the current user and emit save on valid submit', async () => {
    const { MockStore } = await import('@ngrx/store/testing');
    const mockStore = TestBed.inject(MockStore);
    mockStore.setState({
      auth: { ...initialAuthState, user: { id: 'u1' } },
    });
    const accountService = TestBed.inject(AccountService);
    const list = [{ id: 'a1', name: 'Main', currency: 'USD' }] as unknown as Account[];
    const getSpy = (
      vi.spyOn(accountService, 'getByUserId') as unknown as {
        mockReturnValue: (v: unknown) => { mockRestore: () => void };
      }
    ).mockReturnValue(of(list));
    component.ngOnInit();
    expect(getSpy).toHaveBeenCalledWith('u1');
    expect(component.accounts()).toEqual(list);

    const saveSpy = vi.spyOn(component.save, 'emit');
    (
      component as unknown as { txModel: { set: (v: unknown) => void } }
    ).txModel.set({
      accountId: 'a1',
      type: 'debit',
      status: 'completed',
      amount: 42,
      currency: 'USD',
      description: 'Grocery run',
      category: 'Food',
      counterpartyName: 'Store',
      counterpartyIban: '',
      reference: '',
    });
    await submit(component.txForm);
    await fixture.whenStable();
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ amount: 42 }));
    getSpy.mockRestore();
  });
});
