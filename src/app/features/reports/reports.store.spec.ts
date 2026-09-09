import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ReportsStore } from './reports.store';
import { ReportService } from '../../core/services/report.service';
import { initialAuthState } from '@core/store/auth/auth.models';
import { Report, Currency } from '../../core/models';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function fakeReport(partial: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    userId: 'u1',
    title: 'Monthly report',
    type: 'transactions',
    status: 'ready',
    storagePath: 'p',
    ...partial,
  } as Report;
}

describe('ReportsStore', () => {
  const reportService = {
    queryByUser: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    downloadReport: vi.fn(),
  };
  let mockStore: MockStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    reportService.queryByUser.mockReturnValue(of([]));
    reportService.create.mockReturnValue(of('new-id'));
    reportService.delete.mockReturnValue(of('r1'));
    reportService.downloadReport.mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({
      providers: [
        ReportsStore,
        provideMockStore({ initialState: { auth: { ...initialAuthState, user: { id: 'u1' } } } }),
        { provide: ReportService, useValue: reportService },
      ],
    }).compileComponents();
    mockStore = TestBed.inject(MockStore);
  });

  it('creates with initial state', () => {
    const store = TestBed.inject(ReportsStore);
    expect(store.reports()).toEqual([]);
  });

  it('computes counts and filters by search', () => {
    const store = TestBed.inject(ReportsStore);
    reportService.queryByUser.mockReturnValue(
      of([
        fakeReport({ id: '1', status: 'ready' }),
        fakeReport({ id: '2', status: 'generating', title: 'Perf' }),
        fakeReport({ id: '3', status: 'failed' }),
      ]),
    );
    store.loadReports();
    expect(store.readyCount()).toBe(1);
    expect(store.generatingCount()).toBe(1);
    expect(store.failedCount()).toBe(1);
    store.setFilter({ search: 'perf' });
    expect(store.filteredReports().length).toBe(1);
    store.resetFilters();
    expect(store.filteredReports().length).toBe(3);
  });

  it('loadReports handles no-user and error', async () => {
    const store = TestBed.inject(ReportsStore);
    reportService.queryByUser.mockReturnValue(of([fakeReport()]));
    store.loadReports();
    await flush();
    expect(store.reports().length).toBe(1);

    mockStore.setState({ auth: { ...initialAuthState, user: null } });
    store.loadReports();
    await flush();

    mockStore.setState({ auth: { ...initialAuthState, user: { id: 'u1' } } });
    reportService.queryByUser.mockReturnValue(throwError(() => new Error('load fail')));
    store.loadReports();
    await flush();
    expect(store.error()).toBe('load fail');
  });

  it('createReport handles no-user, success and error', async () => {
    const store = TestBed.inject(ReportsStore);
    const payload = {
      title: 'T',
      type: 'transactions' as const,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      accountIds: ['a'],
      currencies: ['USD' as const],
    };
    store.createReport(payload);
    await flush();
    expect(reportService.create).toHaveBeenCalled();
    expect(store.saving()).toBe(false);

    mockStore.setState({ auth: { ...initialAuthState, user: null } });
    store.createReport(payload);
    await flush();

    mockStore.setState({ auth: { ...initialAuthState, user: { id: 'u1' } } });
    reportService.create.mockReturnValueOnce(throwError(() => new Error('create fail')));
    store.createReport(payload);
    await flush();
    expect(store.error()).toBe('create fail');
  });

  it('deleteReport success and error', async () => {
    const store = TestBed.inject(ReportsStore);
    store.deleteReport('r1');
    await flush();
    expect(reportService.delete).toHaveBeenCalledWith('r1');
    reportService.delete.mockReturnValueOnce(throwError(() => new Error('del fail')));
    store.deleteReport('r1');
    await flush();
    expect(store.error()).toBe('del fail');
  });

  it('downloadReport success and error', async () => {
    const store = TestBed.inject(ReportsStore);
    store.downloadReport(fakeReport());
    await flush();
    expect(reportService.downloadReport).toHaveBeenCalled();

    reportService.downloadReport.mockReturnValueOnce(throwError(() => new Error('dl fail')));
    store.downloadReport(fakeReport());
    await flush();
    expect(store.error()).toBe('dl fail');
  });

  it('createReport omits empty filters and errors use fallback messages', async () => {
    const store = TestBed.inject(ReportsStore);
    const messageless = { code: 'ERR_NO_MESSAGE' };
    const payload = {
      title: 'T',
      type: 'transactions' as const,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      accountIds: [] as string[],
      currencies: [] as Currency[],
    };

    store.createReport(payload);
    await flush();
    expect(reportService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ accountIds: undefined, currencies: undefined }),
      }),
    );

    reportService.create.mockReturnValueOnce(throwError(() => messageless));
    store.createReport(payload);
    await flush();
    expect(store.error()).toBe('Failed to create report');

    reportService.queryByUser.mockReturnValueOnce(throwError(() => messageless));
    store.loadReports();
    await flush();
    expect(store.error()).toBe('Failed to load reports');

    reportService.delete.mockReturnValueOnce(throwError(() => messageless));
    store.deleteReport('r1');
    await flush();
    expect(store.error()).toBe('Failed to delete report');

    reportService.downloadReport.mockReturnValueOnce(throwError(() => messageless));
    store.downloadReport(fakeReport());
    await flush();
    expect(store.error()).toBe('Failed to download report');
  });
});
