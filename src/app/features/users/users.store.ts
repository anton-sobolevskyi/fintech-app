import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { User, UserRole } from '../../core/models';
import { UserService } from '../../core/services/user.service';

export interface UsersFilters {
  search: string;
  role: UserRole | null;
}

interface UsersState {
  users: User[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  filters: UsersFilters;
}

const initialFilters: UsersFilters = {
  search: '',
  role: null,
};

const initialState: UsersState = {
  users: [],
  loading: false,
  saving: false,
  error: null,
  filters: initialFilters,
};

export const UsersStore = signalStore(
  withState(initialState),

  withComputed(({ users, filters }) => ({
    adminCount: computed(() => users().filter((u) => u.role === 'admin').length),
    managerCount: computed(() => users().filter((u) => u.role === 'manager').length),
    analystCount: computed(() => users().filter((u) => u.role === 'analyst').length),
    viewerCount: computed(() => users().filter((u) => u.role === 'viewer').length),
    totalCount: computed(() => users().length),

    filteredUsers: computed(() => {
      const search = filters().search.toLowerCase().trim();
      const role = filters().role;

      return users().filter((u) => {
        const matchesRole = !role || u.role === role;
        const matchesSearch =
          !search ||
          u.displayName?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.department?.toLowerCase().includes(search);
        return matchesRole && matchesSearch;
      });
    }),
  })),

  withMethods((store, userService = inject(UserService)) => ({
    setFilter: (partial: Partial<UsersFilters>) => {
      patchState(store, {
        filters: { ...store.filters(), ...partial },
      });
    },

    resetFilters: () => {
      patchState(store, { filters: { ...initialFilters } });
    },

    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => userService.getAllUsers()),
        tapResponse({
          next: (users) => patchState(store, { users, loading: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to load users',
              loading: false,
            }),
        }),
      ),
    ),

    updateRole: rxMethod<{ id: string; role: UserRole }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ id, role }) => userService.update(id, { role })),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to update role',
              saving: false,
            }),
        }),
      ),
    ),

    updateUser: rxMethod<{ id: string; data: Partial<User> }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ id, data }) => userService.update(id, data)),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to update user',
              saving: false,
            }),
        }),
      ),
    ),
  })),
);
