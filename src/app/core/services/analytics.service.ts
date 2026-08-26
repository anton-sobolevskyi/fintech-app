import { inject, Service } from '@angular/core';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { environment } from '../../../environments/environment';
import { FIREBASE_APP } from '../firebase';

@Service()
export class AnalyticsService {
  private analytics: Analytics | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    if (!environment.production) return;
    if (await isSupported()) {
      this.analytics = getAnalytics(inject(FIREBASE_APP));
    }
  }

  async trackEvent(name: string, params?: Record<string, unknown>): Promise<void> {
    await this.ready;
    if (!this.analytics) return;
    logEvent(this.analytics, name, params);
  }
}
