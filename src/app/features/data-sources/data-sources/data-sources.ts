import { Component, inject } from '@angular/core';
import { DataSourcesStore } from '../data-sources.store';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { PIcon } from '@primeicons/angular';

@Component({
  imports: [ButtonModule, TagModule, CardModule, TableModule, ProgressBarModule, PIcon],
  selector: 'app-data-sources',
  styleUrl: './data-sources.css',
  templateUrl: './data-sources.html',
  providers: [DataSourcesStore],
})
export class DataSources {
  readonly store = inject(DataSourcesStore);

  ngOnInit(): void {
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
}
