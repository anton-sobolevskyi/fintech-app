import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AccountsStore } from '../accounts.store';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PIcon } from '@primeicons/angular';
import { AccountStatus } from '@core/models/account.model';
import { Currency } from '@core/models';

type AccountStatusSeverity = 'success' | 'warn' | 'danger' | 'info';

@Component({
  imports: [ButtonModule, CardModule, SkeletonModule, TagModule, TableModule, PIcon],
  selector: 'app-accounts',
  styleUrl: './accounts.css',
  templateUrl: './accounts.html',
  providers: [AccountsStore],
})
export class Accounts {
  readonly store = inject(AccountsStore);

  ngOnInit(): void {
    this.store.loadAccounts();
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
