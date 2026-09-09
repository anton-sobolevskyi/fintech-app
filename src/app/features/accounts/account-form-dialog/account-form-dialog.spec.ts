import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { AccountFormDialog } from './account-form-dialog';
import { TopUpDialog } from '../top-up-dialog/top-up-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { AccountsStore } from '../accounts.store';
import { of } from 'rxjs';

describe('AccountFormDialog', () => {
  let component: AccountFormDialog;
  let fixture: ComponentFixture<AccountFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountFormDialog],
      providers: [
        provideMockStore({
          initialState: {
            auth: { ...initialAuthState, user: { id: 'user-1' } },
          },
        }),
        {
          provide: AccountService,
          useValue: {},
        },
        {
          provide: AccountOperationsService,
          useValue: {
            createAccount: () => of({ success: true, accountId: 'acc-1', iban: 'UA1234567890' }),
            topUp: () => of(undefined),
            lookupByIban: () => of({} as any),
            transfer: () => of(undefined),
          },
        },
        {
          provide: ReportService,
          useValue: { create: () => of('report-id') },
        },
        AccountsStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountFormDialog);
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

  it('should render the dialog template with visible input', async () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('New account');
  });

  it('should render warning when no currencies available', async () => {
    const { patchState } = await import('@ngrx/signals');
    const store = TestBed.inject(AccountsStore);
    patchState(store as never, {
      accounts: [
        { id: '1', currency: 'USD', status: 'active' },
        { id: '2', currency: 'EUR', status: 'active' },
        { id: '3', currency: 'UAH', status: 'active' },
      ],
    });
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('every available currency');
  });

  it('should submit the form by creating an account', async () => {
    const store = TestBed.inject(AccountsStore);
    const createSpy = vi.spyOn(store, 'createAccount');
    const emitSpy = vi.spyOn(component.visibleChange, 'emit');
    const model = (component as unknown as { model: { set: (v: unknown) => void } }).model;
    model.set({ name: 'Main', type: 'checking', currency: 'USD' });
    await submit(component['accountForm']);
    await fixture.whenStable();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Main', currency: 'USD' }),
    );
    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it('should submit top-up for a valid amount', async () => {
    const { provideMockStore } = await import('@ngrx/store/testing');
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TopUpDialog],
      providers: [
        provideMockStore({
          initialState: { auth: { ...initialAuthState, user: { id: 'user-1' } } },
        }),
        { provide: AccountService, useValue: { getByUserId: () => of([]) } },
        {
          provide: AccountOperationsService,
          useValue: {
            topUp: () => of(undefined),
            lookupByIban: () => of({} as never),
            transfer: () => of(undefined),
          },
        },
        { provide: ReportService, useValue: { create: () => of('report-id') } },
        AccountsStore,
      ],
    }).compileComponents();
    const topUpFixture = TestBed.createComponent(TopUpDialog);
    const topUp = topUpFixture.componentInstance;
    await topUpFixture.whenStable();
    topUpFixture.componentRef.setInput('account', { id: 'a1' });
    const model = (topUp as unknown as { model: { set: (v: unknown) => void } }).model;
    model.set({ amount: 25 });
    const store = TestBed.inject(AccountsStore);
    const topUpSpy = vi.spyOn(store, 'topUp');
    await submit(topUp['topUpForm']);
    await topUpFixture.whenStable();
    expect(topUpSpy).toHaveBeenCalledWith({ accountId: 'a1', amount: 25 });
  });
});
