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
});
