import { Component, inject } from '@angular/core';
import { DashboardStore } from '../dashboard.store';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PIcon } from '@primeicons/angular';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  imports: [CommonModule, ButtonModule, CardModule, PIcon, SkeletonModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
  providers: [DashboardStore],
})
export class Dashboard {
  readonly store = inject(DashboardStore);

  ngOnInit(): void {
    this.store.loadDashboard();
  }

  formatCurrency(value: number, currency = 'UAH'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value || 0);
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  getTypeClass(type: string): string {
    if (type === 'credit') return 'text-emerald-500';
    if (type === 'debit' || type === 'fee') return 'text-red-500';
    return 'text-blue-500';
  }
}
