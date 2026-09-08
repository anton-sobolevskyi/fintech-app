import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountFormDialog } from './account-form-dialog';
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
          useValue: { createWithUniqueIban: () => of('id') },
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

    fixture = TestBed.createComponent(AccountFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
