import { Component, effect, input, output, signal } from '@angular/core';
import { form, FormRoot, FormField, required, minLength, min, max } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { DataSource, CloudType, SourceStatus } from '../../../core/models';

interface DataSourceFormModel {
  name: string;
  cloudType: CloudType;
  status: SourceStatus;
  latencyMs: number;
  errorRate: number;
  region: string;
  description: string;
}

@Component({
  selector: 'app-data-source-form-dialog',
  standalone: true,
  imports: [
    DialogModule,
    FormRoot,
    FormField,
    InputTextModule,
    SelectModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
  ],
  templateUrl: './data-source-form-dialog.html',
})
export class DataSourceFormDialog {
  visible = input(false);
  source = input<DataSource | null>(null);
  saving = input(false);

  visibleChange = output<boolean>();
  save = output<DataSourceFormModel>();

  cloudOptions = [
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' },
  ];

  statusOptions = [
    { label: 'Healthy', value: 'healthy' },
    { label: 'Degraded', value: 'degraded' },
    { label: 'Down', value: 'down' },
    { label: 'Maintenance', value: 'maintenance' },
  ];

  regionOptions = [
    { label: 'europe-west1', value: 'europe-west1' },
    { label: 'europe-west3', value: 'europe-west3' },
    { label: 'us-east1', value: 'us-east1' },
    { label: 'us-central1', value: 'us-central1' },
  ];

  model = signal<DataSourceFormModel>({
    name: '',
    cloudType: 'private',
    status: 'healthy',
    latencyMs: 50,
    errorRate: 0,
    region: 'europe-west1',
    description: '',
  });

  sourceForm = form(
    this.model,
    (p) => {
      required(p.name, { message: 'Name is required' });
      minLength(p.name, 2, { message: 'Minimum 2 characters' });
      required(p.cloudType, { message: 'Cloud type is required' });
      required(p.status, { message: 'Status is required' });
      required(p.region, { message: 'Region is required' });
      min(p.latencyMs, 0, { message: 'Latency cannot be negative' });
      min(p.errorRate, 0, { message: 'Min 0%' });
      max(p.errorRate, 100, { message: 'Max 100%' });
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid()) return;
          this.save.emit(f().value());
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const s = this.source();
      if (s) {
        this.model.set({
          name: s.name,
          cloudType: s.cloudType,
          status: s.status,
          latencyMs: s.latencyMs,
          errorRate: s.errorRate,
          region: s.region,
          description: s.description ?? '',
        });
      } else {
        this.model.set({
          name: '',
          cloudType: 'private',
          status: 'healthy',
          latencyMs: 50,
          errorRate: 0,
          region: 'europe-west1',
          description: '',
        });
      }
    });
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }
}
