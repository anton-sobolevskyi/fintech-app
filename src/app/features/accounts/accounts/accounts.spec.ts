import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Accounts } from './accounts';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { AccountOperationsService } from '@core/services/account-operations.service';
import { ReportService } from '@core/services/report.service';
import { of } from 'rxjs';

describe('Accounts', () => {
  let component: Accounts;
  let fixture: ComponentFixture<Accounts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accounts],
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
      ],
    }).compileComponents();

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
});
