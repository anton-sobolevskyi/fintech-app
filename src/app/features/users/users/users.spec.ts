import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Users } from './users';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { UserService } from '@core/services/user.service';
import { of } from 'rxjs';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        { provide: UserService, useValue: { getAllUsers: () => of([]), update: () => of(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
