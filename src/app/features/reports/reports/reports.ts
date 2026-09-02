import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportsStore, CreateReportPayload } from '../reports.store';
import { ReportFormDialog } from '../report-form-dialog/report-form-dialog';
import { Report, ReportType, ReportStatus } from '../../../core/models';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PIcon } from '@primeicons/angular';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    PIcon,
    ReportFormDialog,
  ],
  providers: [ReportsStore, ConfirmationService],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  readonly store = inject(ReportsStore);
  private confirmation = inject(ConfirmationService);

  showDialog = signal(false);

  typeOptions = [
    { label: 'All types', value: null },
    { label: 'Balance', value: 'balance' },
    { label: 'Transactions', value: 'transactions' },
    { label: 'Performance', value: 'performance' },
    { label: 'Custom', value: 'custom' },
  ];

  statusOptions = [
    { label: 'All statuses', value: null },
    { label: 'Ready', value: 'ready' },
    { label: 'Generating', value: 'generating' },
    { label: 'Failed', value: 'failed' },
  ];

  ngOnInit(): void {
    this.store.loadReports();
  }

  openCreate(): void {
    this.showDialog.set(true);
  }

  onSave(payload: CreateReportPayload): void {
    this.store.createReport(payload);
    this.showDialog.set(false);
  }

  onTypeFilter(type: ReportType | null): void {
    this.store.setFilter({ type });
    this.store.loadReports();
  }

  onStatusFilter(status: ReportStatus | null): void {
    this.store.setFilter({ status });
    this.store.loadReports();
  }

  onSearch(search: string): void {
    this.store.setFilter({ search });
  }

  clearFilters(): void {
    this.store.resetFilters();
    this.store.loadReports();
  }

  onDownload(report: Report): void {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  }

  onDelete(report: Report): void {
    this.confirmation.confirm({
      message: `Delete report "${report.title}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.deleteReport(report.id),
    });
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
