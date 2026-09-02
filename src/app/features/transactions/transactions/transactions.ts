import { Component, inject, signal } from '@angular/core';
import { TransactionsStore } from '../transactions.store';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { PIcon } from '@primeicons/angular';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FormsModule } from '@angular/forms';
import { TransactionFormDialog } from '../transaction-form-dialog/transaction-form-dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { Currency, Transaction, TransactionStatus, TransactionType } from '@core/models';
import { ConfirmationService } from 'primeng/api';

@Component({
  imports: [
    ButtonModule,
    TagModule,
    CardModule,
    TableModule,
    PIcon,
    SelectModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule,
    TransactionFormDialog,
    ConfirmDialogModule,
    TooltipModule,
  ],
  selector: 'app-transactions',
  styleUrl: './transactions.css',
  templateUrl: './transactions.html',
  providers: [TransactionsStore, ConfirmationService],
})
export class Transactions {
  readonly store = inject(TransactionsStore);

  private confirmation = inject(ConfirmationService);

  showDialog = signal(false);
  editingTx = signal<Transaction | null>(null);
  accountOptions = this.store.accountOptions;

  typeOptions = [
    { label: 'All Types', value: null },
    { label: 'Credit', value: 'credit' },
    { label: 'Debit', value: 'debit' },
    { label: 'Transfer', value: 'transfer' },
    { label: 'Fee', value: 'fee' },
  ];

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Reversed', value: 'reversed' },
  ];

  ngOnInit(): void {
    this.store.loadTransactions();
    this.store.loadAccounts();
  }

  loadMore(): void {
    this.store.loadMore();
  }

  getTypeSeverity(type: TransactionType): 'success' | 'danger' | 'info' | 'warn' {
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

  getStatusSeverity(status: TransactionStatus): 'success' | 'danger' | 'warn' | 'info' {
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

  formatCurrency(value: number, currency: Currency = 'USD'): string {
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

  onSearch(value: string): void {
    this.store.setFilter({ search: value });
  }

  onTypeChange(type: string | null): void {
    this.store.setFilter({ type });
    this.store.applyFilters();
  }

  onStatusChange(status: string | null): void {
    this.store.setFilter({ status });
    this.store.applyFilters();
  }

  clearFilters(): void {
    this.store.resetFilters();
    this.store.loadTransactions();
  }

  openCreate(): void {
    this.editingTx.set(null);
    this.showDialog.set(true);
  }

  openEdit(tx: Transaction): void {
    this.editingTx.set(tx);
    this.showDialog.set(true);
  }

  onSave(data: any): void {
    const editing = this.editingTx();
    if (editing) {
      this.store.updateTransaction({ id: editing.id, data });
    } else {
      this.store.createTransaction(data);
    }
    this.showDialog.set(false);
    this.store.loadTransactions();
  }

  onDelete(tx: Transaction): void {
    this.confirmation.confirm({
      message: `Delete transaction "${tx.description}"?`,
      header: 'Confirm',
      accept: () => this.store.deleteTransaction(tx.id),
    });
  }

  onAccountChange(accountId: string | null): void {
    this.store.setFilter({ accountId });
    this.store.applyFilters();
  }
}
