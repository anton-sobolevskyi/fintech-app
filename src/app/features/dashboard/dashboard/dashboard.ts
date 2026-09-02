import { Component, effect, ElementRef, inject, viewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardStore } from '../dashboard.store';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { PIcon } from '@primeicons/angular';

Chart.register(...registerables);

@Component({
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, SkeletonModule, PIcon],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
  providers: [DashboardStore],
})
export class Dashboard implements OnDestroy {
  readonly store = inject(DashboardStore);

  private chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('cashFlowChart');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const loading = this.store.loading();
      const data = this.store.cashFlowChart();

      if (loading || !data) return;

      queueMicrotask(() => this.renderChart(data));
    });
  }

  ngOnInit(): void {
    this.store.loadDashboard();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      tension: number;
      fill: boolean;
    }[];
  }): void {
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas) return;

    this.chart?.destroy();

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.borderColor,
          tension: ds.tension ?? 0.4,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    };

    this.chart = new Chart(canvas, config);
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
