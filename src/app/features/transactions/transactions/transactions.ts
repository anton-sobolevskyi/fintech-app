import { Component, inject } from '@angular/core';
import { TransactionsStore } from '../transactions.store';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { PIcon, Plus } from '@primeicons/angular';

@Component({
  imports: [ButtonModule, TagModule, CardModule, TableModule, PIcon],
  selector: 'app-transactions',
  styleUrl: './transactions.css',
  templateUrl: './transactions.html',
  providers: [TransactionsStore],
})
export class Transactions {
  readonly store = inject(TransactionsStore);

  ngOnInit(): void {
    this.store.loadTransactions();
  }

  loadMore(): void {
    this.store.loadMore();
  }

  getTypeSeverity(type: string): 'success' | 'danger' | 'info' | 'warn' {
    switch (type) {
      case 'credit':
        return 'success';
      case 'debit':
        return 'danger';
      case 'transfer':
        return 'info';
      case 'fee':
        return 'warn';
      default:
        return 'info';
    }
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warn';
      case 'failed':
        return 'danger';
      case 'reversed':
        return 'info';
      default:
        return 'info';
    }
  }

  formatCurrency(value: number, currency: string = 'UAH'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
