import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UsersStore } from './users.store';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function fakeUser(partial: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'a@example.com',
    displayName: 'Alice',
    role: 'admin',
    department: 'Finance',
    ...partial,
  } as User;
}

describe('UsersStore', () => {
  const userService = { getAllUsers: vi.fn(), update: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    userService.getAllUsers.mockReturnValue(of([]));
    userService.update.mockReturnValue(of(null));
    await TestBed.configureTestingModule({
      providers: [UsersStore, { provide: UserService, useValue: userService }],
    }).compileComponents();
  });

  it('creates with initial state', () => {
    const store = TestBed.inject(UsersStore);
    expect(store.users()).toEqual([]);
    expect(store.totalCount()).toBe(0);
  });

  it('computes role counts', () => {
    const store = TestBed.inject(UsersStore);
    userService.getAllUsers.mockReturnValue(
      of([
        fakeUser({ id: '1', role: 'admin' }),
        fakeUser({ id: '2', role: 'manager' }),
        fakeUser({ id: '3', role: 'analyst' }),
        fakeUser({ id: '4', role: 'viewer' }),
      ]),
    );
    store.loadUsers();
    expect(store.adminCount()).toBe(1);
    expect(store.managerCount()).toBe(1);
    expect(store.analystCount()).toBe(1);
    expect(store.viewerCount()).toBe(1);
    expect(store.totalCount()).toBe(4);
  });

  it('filters by role and search', () => {
    const store = TestBed.inject(UsersStore);
    userService.getAllUsers.mockReturnValue(
      of([
        fakeUser({ id: '1', displayName: 'Alice', email: 'alice@x.com', role: 'admin' }),
        fakeUser({ id: '2', displayName: 'Bob', email: 'bob@x.com', role: 'viewer' }),
      ]),
    );
    store.loadUsers();
    store.setFilter({ role: 'admin' });
    expect(store.filteredUsers().length).toBe(1);
    store.setFilter({ role: null, search: 'bob' });
    expect(store.filteredUsers().map((u) => u.id)).toEqual(['2']);
    store.resetFilters();
    expect(store.filteredUsers().length).toBe(2);
  });

  it('loadUsers error path', async () => {
    const store = TestBed.inject(UsersStore);
    userService.getAllUsers.mockReturnValue(throwError(() => new Error('users fail')));
    store.loadUsers();
    await flush();
    expect(store.error()).toBe('users fail');
    expect(store.loading()).toBe(false);
  });

  it('updateRole success and error', async () => {
    const store = TestBed.inject(UsersStore);
    store.updateRole({ id: 'u1', role: 'manager' });
    await flush();
    expect(userService.update).toHaveBeenCalledWith('u1', { role: 'manager' });
    expect(store.saving()).toBe(false);

    userService.update.mockReturnValueOnce(throwError(() => new Error('role fail')));
    store.updateRole({ id: 'u1', role: 'viewer' });
    await flush();
    expect(store.error()).toBe('role fail');
  });

  it('updateUser success and error', async () => {
    const store = TestBed.inject(UsersStore);
    store.updateUser({ id: 'u1', data: { displayName: 'New' } });
    await flush();
    expect(userService.update).toHaveBeenCalledWith('u1', { displayName: 'New' });

    userService.update.mockReturnValueOnce(throwError(() => new Error('user fail')));
    store.updateUser({ id: 'u1', data: { displayName: 'X' } });
    await flush();
    expect(store.error()).toBe('user fail');
  });
});
