import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopUpDialog } from './top-up-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { AccountsStore } from '../accounts.store';
import { of } from 'rxjs';

describe('TopUpDialog', () => {
  let component: TopUpDialog;
  let fixture: ComponentFixture<TopUpDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopUpDialog],
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

    fixture = TestBed.createComponent(TopUpDialog);
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
    fixture.componentRef.setInput('account', { id: 'a1', name: 'Main', currency: 'USD' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Top up');
  });

  it('should render error message when store has error', async () => {
    const { patchState } = await import('@ngrx/signals');
    const store = TestBed.inject(AccountsStore);
    patchState(store as never, { error: 'Boom' });
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Boom');
  });
});
