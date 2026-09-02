import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AccountsStore } from '../accounts.store';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PIcon } from '@primeicons/angular';
import { Account, AccountStatus, Currency } from '@core/models';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AccountFormDialog } from '../account-form-dialog/account-form-dialog';

type AccountStatusSeverity = 'success' | 'warn' | 'danger' | 'info';

@Component({
  imports: [
    ButtonModule,
    CardModule,
    SkeletonModule,
    TagModule,
    TableModule,
    PIcon,
    AccountFormDialog,
    ConfirmDialogModule,
  ],
  selector: 'app-accounts',
  styleUrl: './accounts.css',
  templateUrl: './accounts.html',
  providers: [AccountsStore, ConfirmationService],
})
export class Accounts {
  readonly store = inject(AccountsStore);
  private confirmation = inject(ConfirmationService);

  showDialog = signal(false);
  editingAccount = signal<Account | null>(null);

  ngOnInit(): void {
    this.store.loadAccounts();
  }

  openCreate(): void {
    this.editingAccount.set(null);
    this.showDialog.set(true);
  }

  openEdit(account: Account): void {
    this.editingAccount.set(account);
    this.showDialog.set(true);
  }

  onSave(data: any): void {
    const editing = this.editingAccount();
    if (editing) {
      this.store.updateAccount({ id: editing.id, data });
    } else {
      this.store.createAccount(data);
    }
    this.showDialog.set(false);
  }

  onDelete(account: Account): void {
    this.confirmation.confirm({
      message: `Delete account "${account.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.deleteAccount(account.id),
    });
  }

  getStatusSeverity(status: AccountStatus): AccountStatusSeverity {
    switch (status) {
      case 'active':
        return 'success';
      case 'frozen':
        return 'warn';
      case 'closed':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatCurrency(value: number, currency: Currency = 'USD'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  }
}
