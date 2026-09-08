import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionFormDialog } from './transaction-form-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
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
});
