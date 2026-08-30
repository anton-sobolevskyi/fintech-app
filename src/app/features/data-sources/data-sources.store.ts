import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { DataSource } from '../../core/models';
import { DataSourceService } from '../../core/services/data-source.service';

interface DataSourcesState {
  sources: DataSource[];
  loading: boolean;
  error: string | null;
}

const initialState: DataSourcesState = {
  sources: [],
  loading: false,
  error: null,
};

export const DataSourcesStore = signalStore(
  withState(initialState),

  withComputed(({ sources }) => ({
    healthyCount: computed(() => sources().filter((s) => s.status === 'healthy').length),
    degradedCount: computed(() => sources().filter((s) => s.status === 'degraded').length),
    downCount: computed(() => sources().filter((s) => s.status === 'down').length),
    privateCount: computed(() => sources().filter((s) => s.cloudType === 'private').length),
    publicCount: computed(() => sources().filter((s) => s.cloudType === 'public').length),
  })),

  withMethods((store, dataSourceService = inject(DataSourceService)) => ({
    loadSources: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => dataSourceService.getAll()),
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
  })),
);
