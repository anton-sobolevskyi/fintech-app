import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAvatar } from './user-avatar';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';

describe('UserAvatar', () => {
  let component: UserAvatar;
  let fixture: ComponentFixture<UserAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAvatar],
      providers: [provideMockStore({ initialState: { auth: initialAuthState } })],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAvatar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
