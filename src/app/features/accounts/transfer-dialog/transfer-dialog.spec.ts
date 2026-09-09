import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransferDialog } from './transfer-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { AccountsStore } from '../accounts.store';
import { of } from 'rxjs';

describe('TransferDialog', () => {
  let component: TransferDialog;
  let fixture: ComponentFixture<TransferDialog>;
  let store: InstanceType<typeof AccountsStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferDialog],
      providers: [
        provideMockStore({
          initialState: {
            auth: { ...initialAuthState, user: { id: 'user-1' } },
          },
        }),
        {
          provide: AccountService,
          useValue: { getByUserId: () => of([]) },
        },
        {
          provide: AccountOperationsService,
          useValue: {
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

    fixture = TestBed.createComponent(TransferDialog);
    component = fixture.componentInstance;
    store = TestBed.inject(AccountsStore);
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

  it('should format IBAN via util', () => {
    expect(
      (component as unknown as { formattedIban: (v: string) => string }).formattedIban(
        'UA1234567890',
      ),
    ).toContain('UA12');
  });

  it('should lookup recipient for valid IBAN', () => {
    const spy = vi.spyOn(store, 'lookupByIban');
    (
      component as unknown as { model: { set: (v: unknown) => void } }
    ).model.set({ iban: 'UA213223130000026007233566001', amount: 10 });
    (component as unknown as { lookupRecipient: () => void }).lookupRecipient();
    expect(spy).toHaveBeenCalled();
  });

  it('should not lookup invalid IBAN', () => {
    const spy = vi.spyOn(store, 'lookupByIban');
    (
      component as unknown as { model: { set: (v: unknown) => void } }
    ).model.set({ iban: 'INVALID', amount: 10 });
    (component as unknown as { lookupRecipient: () => void }).lookupRecipient();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should detect currency mismatch', async () => {
    const comp = component as unknown as {
      currencyMismatch: () => boolean;
    };
    const { patchState } = await import('@ngrx/signals');
    fixture.componentRef.setInput('account', { id: 'a', currency: 'USD' });
    patchState(store as never, {
      recipient: {
        iban: 'X',
        ownerName: 'O',
        name: 'O',
        type: 'checking',
        bankName: 'B',
        currency: 'USD',
        status: 'active',
        isOwn: false,
      },
    });
    expect(comp.currencyMismatch()).toBe(false);
    patchState(store as never, {
      recipient: {
        iban: 'X',
        ownerName: 'O',
        name: 'O',
        type: 'checking',
        bankName: 'B',
        currency: 'EUR',
        status: 'active',
        isOwn: false,
      },
    });
    expect(comp.currencyMismatch()).toBe(true);
  });
});
