import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DataSourcesStore } from './data-sources.store';
import { DataSourceService } from '../../core/services/data-source.service';
import { DataSource } from '../../core/models';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function fakeSource(partial: Partial<DataSource> = {}): DataSource {
  return {
    id: 's1',
    name: 'Source One',
    cloudType: 'public',
    status: 'healthy',
    region: 'eu-west',
    description: 'main source',
    ...partial,
  } as DataSource;
}

describe('DataSourcesStore', () => {
  const dsService = { querySources: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    dsService.querySources.mockReturnValue(of([]));
    dsService.create.mockReturnValue(of('new-id'));
    dsService.update.mockReturnValue(of(null));
    dsService.delete.mockReturnValue(of('s1'));
    await TestBed.configureTestingModule({
      providers: [DataSourcesStore, { provide: DataSourceService, useValue: dsService }],
    }).compileComponents();
  });

  it('creates with initial state', () => {
    const store = TestBed.inject(DataSourcesStore);
    expect(store.sources()).toEqual([]);
  });

  it('computes status and cloud counts', () => {
    const store = TestBed.inject(DataSourcesStore);
    dsService.querySources.mockReturnValue(
      of([
        fakeSource({ id: '1', status: 'healthy', cloudType: 'public' }),
        fakeSource({ id: '2', status: 'degraded', cloudType: 'private' }),
        fakeSource({ id: '3', status: 'down', cloudType: 'private' }),
      ]),
    );
    store.loadSources();
    expect(store.healthyCount()).toBe(1);
    expect(store.degradedCount()).toBe(1);
    expect(store.downCount()).toBe(1);
    expect(store.privateCount()).toBe(2);
    expect(store.publicCount()).toBe(1);
  });

  it('filters by search and resets', () => {
    const store = TestBed.inject(DataSourcesStore);
    dsService.querySources.mockReturnValue(
      of([fakeSource({ name: 'Alpha' }), fakeSource({ name: 'Beta', region: 'us-east' })]),
    );
    store.loadSources();
    store.setFilter({ search: 'alpha' });
    expect(store.filteredSources().length).toBe(1);
    store.setFilter({ search: '  ' });
    expect(store.filteredSources().length).toBe(2);
    store.setFilter({ search: 'nonexistent' });
    expect(store.filteredSources()).toEqual([]);
    store.resetFilters();
    expect(store.filteredSources().length).toBe(2);
  });

  it('loadSources error path', async () => {
    const store = TestBed.inject(DataSourcesStore);
    dsService.querySources.mockReturnValue(throwError(() => new Error('load fail')));
    store.loadSources();
    await flush();
    expect(store.error()).toBe('load fail');
  });

  it('create/update/delete success and error', async () => {
    const store = TestBed.inject(DataSourcesStore);
    store.createSource({ name: 'n' } as never);
    await flush();
    expect(store.saving()).toBe(false);
    dsService.create.mockReturnValueOnce(throwError(() => new Error('c fail')));
    store.createSource({ name: 'n' } as never);
    await flush();
    expect(store.error()).toBe('c fail');

    store.updateSource({ id: 's1', data: { name: 'x' } });
    await flush();
    expect(dsService.update).toHaveBeenCalled();
    dsService.update.mockReturnValueOnce(throwError(() => new Error('u fail')));
    store.updateSource({ id: 's1', data: { name: 'x' } });
    await flush();
    expect(store.error()).toBe('u fail');

    store.deleteSource('s1');
    await flush();
    expect(dsService.delete).toHaveBeenCalledWith('s1');
    dsService.delete.mockReturnValueOnce(throwError(() => new Error('d fail')));
    store.deleteSource('s1');
    await flush();
    expect(store.error()).toBe('d fail');
  });

  it('syncSource handles missing source, success and error', async () => {
    const store = TestBed.inject(DataSourcesStore);
    dsService.querySources.mockReturnValue(of([fakeSource({ id: 's1' })]));
    store.loadSources();
    store.syncSource('missing-id');
    await flush();
    expect(store.saving()).toBe(false);

    store.syncSource('s1');
    await flush();
    expect(dsService.update).toHaveBeenCalled();
    expect(store.saving()).toBe(false);

    dsService.update.mockReturnValueOnce(throwError(() => new Error('sync fail')));
    store.syncSource('s1');
    await flush();
    expect(store.error()).toBe('sync fail');
  });
});
