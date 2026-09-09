import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { TransactionService } from '@core/services/transaction.service';
import { of } from 'rxjs';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: { auth: initialAuthState } }),
        { provide: AccountService, useValue: { getByUserId: () => of([]) } },
        { provide: TransactionService, useValue: { getByUserId: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format currency and dates and map type classes', () => {
    expect(component.formatCurrency(100, 'USD')).toContain('100');
    expect(component.formatDate(undefined)).toBe('');
    expect(component.formatDate(new Date('2024-06-01T10:00:00'))).toContain('черв');
    expect(
      component.formatDate({ toDate: () => new Date('2024-06-02T10:00:00') } as never),
    ).toContain('черв');
    expect(component.getTypeClass('credit')).toBe('text-emerald-500');
    expect(component.getTypeClass('debit')).toBe('text-red-500');
    expect(component.getTypeClass('fee')).toBe('text-red-500');
    expect(component.getTypeClass('transfer')).toBe('text-blue-500');
  });

  it('should destroy chart on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

    it('should render dashboard sections', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dashboard');
    expect(text).toContain('Overview of your financial activity');
    expect(text).toContain('No accounts found');
    expect(text).toContain('No recent transactions');
    expect(text).toContain('View all transactions');
  });

  it('should render balances and recent transactions', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, {
      accounts: [{ id: 'a', currency: 'USD', balance: 100 }],
      transactions: [
        {
          id: 't1',
          description: 'Salary',
          type: 'credit',
          amount: 1000,
          currency: 'USD',
          createdAt: new Date('2024-06-01T10:00:00'),
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Salary');
    expect(text).toContain('USD');
  });

  it('should render loading skeletons and error', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, { loading: true });
    fixture.detectChanges();
    await fixture.whenStable();
    patchState(component.store as never, { loading: false, error: 'Boom' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Boom');
  });
});
