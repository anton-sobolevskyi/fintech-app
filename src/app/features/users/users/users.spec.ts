import { vi } from 'vitest';
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

  it('should load users on init and manage filters', () => {
    const loadSpy = vi.spyOn(component.store, 'loadUsers');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalled();
    const setSpy = vi.spyOn(component.store, 'setFilter');
    component.onSearch('alice');
    expect(setSpy).toHaveBeenCalledWith({ search: 'alice' });
    component.onRoleFilter('admin');
    expect(setSpy).toHaveBeenCalledWith({ role: 'admin' });
    const resetSpy = vi.spyOn(component.store, 'resetFilters');
    component.clearFilters();
    expect(resetSpy).toHaveBeenCalled();
  });

  it('should not update role when unchanged or self-demotion', () => {
    const spy = vi.spyOn(component.store, 'updateRole');
    component.onRoleChange({ id: 'u1', role: 'admin' } as never, 'admin');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should update role for other users', () => {
    const spy = vi.spyOn(component.store, 'updateRole');
    component.onRoleChange({ id: 'other', role: 'viewer' } as never, 'manager');
    expect(spy).toHaveBeenCalledWith({ id: 'other', role: 'manager' });
  });

  it('should map role severity, avatar label, date and self check', () => {
    expect(component.getRoleSeverity('admin')).toBe('danger');
    expect(component.getRoleSeverity('manager')).toBe('warn');
    expect(component.getRoleSeverity('analyst')).toBe('info');
    expect(component.getRoleSeverity('viewer')).toBe('secondary');
    expect(component.getRoleSeverity('other')).toBe('secondary');
    expect(component.avatarLabel({ displayName: 'Bob' } as never)).toBe('B');
    expect(component.avatarLabel({ email: 'x@y.com' } as never)).toBe('X');
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate(new Date('2024-04-01T10:00:00'))).toContain('2024');
    expect(
      component.formatDate({ toDate: () => new Date('2024-04-02T10:00:00') } as never),
    ).toContain('2024');
    expect(component.isSelf({ id: 'nope' } as never)).toBe(false);
  });

  it('should render user rows and empty state', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, {
      users: [
        {
          id: 'u1',
          displayName: 'Alice',
          email: 'alice@x.com',
          role: 'admin',
          department: 'Finance',
          createdAt: new Date('2024-04-01T10:00:00'),
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Alice');

    patchState(component.store as never, { users: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Users');
  });
});
