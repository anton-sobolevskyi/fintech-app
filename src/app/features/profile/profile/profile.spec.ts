import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { UserService } from '@core/services/user.service';
import { StorageService } from '@core/services/storage.service';
import { of } from 'rxjs';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        { provide: UserService, useValue: { update: () => of(null) } },
        { provide: StorageService, useValue: { uploadAvatarWithProgress: () => of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
