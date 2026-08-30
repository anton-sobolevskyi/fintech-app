import { Component, inject } from '@angular/core';
import { ReportsStore } from '../reports.store';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { PIcon } from '@primeicons/angular';

@Component({
  imports: [ButtonModule, TagModule, CardModule, TableModule, PIcon],
  selector: 'app-reports',
  styleUrl: './reports.css',
  templateUrl: './reports.html',
  providers: [ReportsStore],
})
export class Reports {
  readonly store = inject(ReportsStore);

  ngOnInit(): void {
    this.store.loadReports();
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'ready':
        return 'success';
      case 'generating':
        return 'warn';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '—';
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
