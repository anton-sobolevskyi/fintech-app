import { Component, inject, signal } from '@angular/core';
import { DataSourcesStore } from '../data-sources.store';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { PIcon } from '@primeicons/angular';
import { ConfirmationService } from 'primeng/api';
import { CloudType, DataSource, SourceStatus } from '@core/models';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataSourceFormDialog } from '../data-source-form-dialog/data-source-form-dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [
    ButtonModule,
    TagModule,
    CardModule,
    TableModule,
    ProgressBarModule,
    PIcon,
    FormsModule,
    SelectModule,
    InputTextModule,
    DataSourceFormDialog,
    ConfirmDialogModule,
  ],
  selector: 'app-data-sources',
  styleUrl: './data-sources.css',
  templateUrl: './data-sources.html',
  providers: [DataSourcesStore, ConfirmationService],
})
export class DataSources {
  readonly store = inject(DataSourcesStore);
  private confirmation = inject(ConfirmationService);

  showDialog = signal(false);
  editingSource = signal<DataSource | null>(null);

  cloudOptions = [
    { label: 'All clouds', value: null },
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' },
  ];

  statusOptions = [
    { label: 'All statuses', value: null },
    { label: 'Healthy', value: 'healthy' },
    { label: 'Degraded', value: 'degraded' },
    { label: 'Down', value: 'down' },
    { label: 'Maintenance', value: 'maintenance' },
  ];

  ngOnInit(): void {
    this.store.loadSources();
  }

  openCreate(): void {
    this.editingSource.set(null);
    this.showDialog.set(true);
  }

  openEdit(source: DataSource): void {
    this.editingSource.set(source);
    this.showDialog.set(true);
  }

  onSave(data: any): void {
    const editing = this.editingSource();
    if (editing) {
      this.store.updateSource({ id: editing.id, data });
    } else {
      this.store.createSource(data);
    }
    this.showDialog.set(false);
  }

  onDelete(source: DataSource): void {
    this.confirmation.confirm({
      message: `Delete data source "${source.name}"?`,
      header: 'Confirm',
      accept: () => this.store.deleteSource(source.id),
    });
  }

  onSync(source: DataSource): void {
    this.store.syncSource(source.id);
  }

  onCloudChange(cloudType: CloudType | null): void {
    this.store.setFilter({ cloudType });
    this.store.loadSources();
  }

  onStatusChange(status: SourceStatus | null): void {
    this.store.setFilter({ status });
    this.store.loadSources();
  }

  onSearch(search: string): void {
    this.store.setFilter({ search });
  }

  clearFilters(): void {
    this.store.resetFilters();
    this.store.loadSources();
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warn';
      case 'down':
        return 'danger';
      case 'maintenance':
        return 'info';
      default:
        return 'info';
    }
  }

  getCloudSeverity(type: string): 'info' | 'secondary' {
    return type === 'private' ? 'secondary' : 'info';
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
