import { Component, inject, signal } from '@angular/core';
import { CreateReportPayload, ReportsStore } from '../reports.store';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { PIcon } from '@primeicons/angular';
import { ConfirmationService } from 'primeng/api';
import { Report } from '@core/models';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ReportFormDialog } from '../report-form-dialog/report-form-dialog';

@Component({
  imports: [
    ButtonModule,
    TagModule,
    CardModule,
    TableModule,
    PIcon,
    ReportFormDialog,
    ConfirmDialogModule,
  ],
  selector: 'app-reports',
  styleUrl: './reports.css',
  templateUrl: './reports.html',
  providers: [ReportsStore, ConfirmationService],
})
export class Reports {
  readonly store = inject(ReportsStore);
  private confirmation = inject(ConfirmationService);

  showDialog = signal(false);

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

  onDelete(report: Report): void {
    this.confirmation.confirm({
      message: `Delete report "${report.title}"?`,
      header: 'Confirm',
      accept: () => this.store.deleteReport(report.id),
    });
  }

  onDownload(report: Report): void {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
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
