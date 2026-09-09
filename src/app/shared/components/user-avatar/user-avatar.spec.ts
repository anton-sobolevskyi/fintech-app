import { vi } from 'vitest';
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

  it('should compute size classes', () => {
    fixture.componentRef.setInput('size', 'small');
    fixture.detectChanges();
    expect(component.getClasses()['size-6']).toBe(true);
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();
    expect(component.getClasses()['size-10']).toBe(true);
    fixture.componentRef.setInput('size', 'normal');
    fixture.detectChanges();
    expect(component.getClasses()['size-8']).toBe(true);
  });
});
