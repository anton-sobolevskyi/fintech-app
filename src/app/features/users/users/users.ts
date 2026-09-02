import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersStore } from '../users.store';
import { User, UserRole } from '../../../core/models';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../core/store/auth/auth.selectors';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { PIcon } from '@primeicons/angular';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    TableModule,
    TagModule,
    SelectModule,
    InputTextModule,
    ButtonModule,
    AvatarModule,
    TooltipModule,
    PIcon,
  ],
  providers: [UsersStore],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  readonly store = inject(UsersStore);
  private globalStore = inject(Store);

  currentUser = this.globalStore.selectSignal(selectCurrentUser);

  roleOptions: { label: string; value: UserRole | null }[] = [
    { label: 'All roles', value: null },
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Analyst', value: 'analyst' },
    { label: 'Viewer', value: 'viewer' },
  ];

  roleEditOptions: { label: string; value: UserRole }[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Analyst', value: 'analyst' },
    { label: 'Viewer', value: 'viewer' },
  ];

  ngOnInit(): void {
    this.store.loadUsers();
  }

  onSearch(search: string): void {
    this.store.setFilter({ search });
  }

  onRoleFilter(role: UserRole | null): void {
    this.store.setFilter({ role });
  }

  clearFilters(): void {
    this.store.resetFilters();
  }

  onRoleChange(user: User, role: UserRole): void {
    if (user.role === role) return;
    // Prevent admin from demoting themselves accidentally
    if (user.id === this.currentUser()?.id && role !== 'admin') {
      return;
    }
    this.store.updateRole({ id: user.id, role });
  }

  getRoleSeverity(role: string): 'danger' | 'warn' | 'info' | 'success' | 'secondary' {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'manager':
        return 'warn';
      case 'analyst':
        return 'info';
      case 'viewer':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  avatarLabel(user: User): string {
    return (user.displayName || user.email || '?').charAt(0).toUpperCase();
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  isSelf(user: User): boolean {
    return user.id === this.currentUser()?.id;
  }
}
