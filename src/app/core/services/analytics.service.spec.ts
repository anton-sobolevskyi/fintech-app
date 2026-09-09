import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

const analyticsMocks = vi.hoisted(() => ({
  logEvent: vi.fn(),
}));

vi.mock('firebase/analytics', () => analyticsMocks);

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [AnalyticsService],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be a no-op when analytics is unavailable', async () => {
    await service.trackEvent('page_view', { path: '/' });
    expect(analyticsMocks.logEvent).not.toHaveBeenCalled();
  });

  it('should log events when an analytics instance is available', async () => {
    (service as unknown as { analytics: unknown }).analytics = { analytics: true };
    await service.trackEvent('page_view', { path: '/' });
    expect(analyticsMocks.logEvent).toHaveBeenCalledWith({ analytics: true }, 'page_view', {
      path: '/',
    });
  });
});
