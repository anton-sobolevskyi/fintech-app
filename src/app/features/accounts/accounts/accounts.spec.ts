import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Accounts } from './accounts';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { of } from 'rxjs';

describe('Accounts', () => {
  let component: Accounts;
  let fixture: ComponentFixture<Accounts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accounts],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        {
          provide: AccountService,
          useValue: { getByUserId: () => of([]), create: () => of('id') },
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
});
