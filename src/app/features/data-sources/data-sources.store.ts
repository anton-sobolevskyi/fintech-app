import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { serverTimestamp } from 'firebase/firestore';
import { DataSource, CloudType, SourceStatus } from '../../core/models';
import { DataSourceService } from '../../core/services/data-source.service';

export interface DataSourceFilters {
  cloudType: CloudType | null;
  status: SourceStatus | null;
  search: string;
}

interface DataSourcesState {
  sources: DataSource[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  filters: DataSourceFilters;
}

const initialFilters: DataSourceFilters = {
  cloudType: null,
  status: null,
  search: '',
};

const initialState: DataSourcesState = {
  sources: [],
  loading: false,
  saving: false,
  error: null,
  filters: initialFilters,
};

export const DataSourcesStore = signalStore(
  withState(initialState),

  withComputed(({ sources, filters }) => ({
    healthyCount: computed(() => sources().filter((s) => s.status === 'healthy').length),
    degradedCount: computed(() => sources().filter((s) => s.status === 'degraded').length),
    downCount: computed(() => sources().filter((s) => s.status === 'down').length),
    privateCount: computed(() => sources().filter((s) => s.cloudType === 'private').length),
    publicCount: computed(() => sources().filter((s) => s.cloudType === 'public').length),

    filteredSources: computed(() => {
      const search = filters().search.toLowerCase().trim();
      if (!search) return sources();

      return sources().filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.region.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search),
      );
    }),
  })),

  withMethods((store, dataSourceService = inject(DataSourceService)) => ({
    setFilter: (partial: Partial<DataSourceFilters>) => {
      patchState(store, {
        filters: { ...store.filters(), ...partial },
      });
    },

    resetFilters: () => {
      patchState(store, { filters: { ...initialFilters } });
    },

    loadSources: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const { cloudType, status } = store.filters();
          return dataSourceService.querySources({ cloudType, status });
        }),
        tapResponse({
          next: (sources) => patchState(store, { sources, loading: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to load data sources',
              loading: false,
            }),
        }),
      ),
    ),

    createSource: rxMethod<Omit<DataSource, 'id' | 'lastSyncAt'>>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((data) =>
          dataSourceService.create({
            ...data,
            lastSyncAt: serverTimestamp() as any,
          } as any),
        ),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to create source',
              saving: false,
            }),
        }),
      ),
    ),

    updateSource: rxMethod<{ id: string; data: Partial<DataSource> }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ id, data }) => dataSourceService.update(id, data)),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to update source',
              saving: false,
            }),
        }),
      ),
    ),

    deleteSource: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((id) => dataSourceService.delete(id)),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to delete source',
              saving: false,
            }),
        }),
      ),
    ),

    /** Simulate a health check / sync for one source */
    syncSource: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((id) => {
          const source = store.sources().find((s) => s.id === id);
          if (!source) return of(null);

          // Fake metrics
          const latencyMs = Math.floor(Math.random() * 400) + 20;
          const errorRate = Math.round(Math.random() * 5 * 10) / 10;
          let status: SourceStatus = 'healthy';
          if (errorRate > 3 || latencyMs > 300) status = 'degraded';
          if (errorRate > 8 || latencyMs > 800) status = 'down';

          return dataSourceService.update(id, {
            latencyMs,
            errorRate,
            status,
            lastSyncAt: serverTimestamp() as any,
          });
        }),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to sync source',
              saving: false,
            }),
        }),
      ),
    ),
  })),
);
