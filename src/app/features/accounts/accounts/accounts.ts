import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AccountsStore } from '../accounts.store';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

@Component({
  imports: [ButtonModule, CardModule, SkeletonModule, TagModule, TableModule],
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

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
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

  formatCurrency(value: number, currency: string = 'UAH'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  }
}
