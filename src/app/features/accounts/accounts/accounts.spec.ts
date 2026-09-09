import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Accounts } from './accounts';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { of } from 'rxjs';

const fakeAccount = (partial: Record<string, unknown> = {}) => ({
  id: 'acc-1',
  userId: 'user-1',
  name: 'Main Checking',
  type: 'checking',
  iban: 'UA213223130000026007233566001',
  balance: 1250.5,
  currency: 'USD',
  status: 'active',
  ...partial,
});

function setup(accounts: Record<string, unknown>[] = [fakeAccount()]) {
  return TestBed.configureTestingModule({
    imports: [Accounts],
    providers: [
      provideMockStore({
        initialState: {
          auth: { ...initialAuthState, user: { id: 'user-1' } },
        },
      }),
      { provide: AccountService, useValue: { getByUserId: () => of(accounts) } },
      {
        provide: AccountOperationsService,
        useValue: {
          createAccount: () => of({ success: true, accountId: 'acc-1', iban: 'UA1234567890' }),
          topUp: () => of(undefined),
          lookupByIban: () => of({} as never),
          transfer: () => of(undefined),
        },
      },
      { provide: ReportService, useValue: { create: () => of('report-id') } },
    ],
  }).compileComponents();
}

describe('Accounts', () => {
  let component: Accounts;
  let fixture: ComponentFixture<Accounts>;

  beforeEach(async () => {
    await setup();
    fixture = TestBed.createComponent(Accounts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format IBAN with spaces', () => {
    expect(component.formatIbanText('UA1234567890')).toContain('UA12 3456 7890');
  });

  it('should open create, top-up and transfer dialogs', () => {
    component.openCreate();
    expect(component.showDialog()).toBe(true);
    const acc = { id: 'a1' } as never;
    component.openTopUp(acc);
    expect(component.topUpTarget()).toBe(acc);
    component.openTransfer(acc);
    expect(component.transferSource()).toBe(acc);
  });

  it('should delegate report generation to the store', () => {
    const spy = vi.spyOn(component.store, 'generateReportForAccount');
    const acc = { id: 'a1' } as never;
    component.generateReport(acc);
    expect(spy).toHaveBeenCalledWith(acc);
  });

  it('should render account rows with formatted balance', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Main Checking');
    expect(text).toContain('USD');
  });

  it('should render action buttons for each account', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should open dialogs when row action buttons are clicked', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const topUpSpy = vi.spyOn(component, 'openTopUp');
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const topUpBtn = buttons.find((b) =>
      (b.nativeElement.getAttribute('aria-label') ?? '').startsWith('Top up'),
    );
    expect(topUpBtn).toBeTruthy();
    topUpBtn?.triggerEventHandler('click', null);
    expect(topUpSpy).toHaveBeenCalled();
  });

  it('should show the error banner when the store reports an error', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, { error: 'Boom' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Boom');
  });
});
