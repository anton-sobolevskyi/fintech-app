import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Timestamp } from 'firebase/firestore';
import { Report, ReportType, ReportStatus } from '../../core/models';
import { ReportService } from '../../core/services/report.service';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';

export interface ReportFilters {
  search: string;
  type: ReportType | null;
  status: ReportStatus | null;
}

export interface CreateReportPayload {
  title: string;
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  currencies: string[];
}

interface ReportsState {
  reports: Report[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  filters: ReportFilters;
}

const initialFilters: ReportFilters = {
  search: '',
  type: null,
  status: null,
};

const initialState: ReportsState = {
  reports: [],
  loading: false,
  saving: false,
  error: null,
  filters: initialFilters,
};

export const ReportsStore = signalStore(
  withState(initialState),

  withComputed(({ reports, filters }) => ({
    readyCount: computed(() => reports().filter((r) => r.status === 'ready').length),
    generatingCount: computed(() => reports().filter((r) => r.status === 'generating').length),
    failedCount: computed(() => reports().filter((r) => r.status === 'failed').length),

    filteredReports: computed(() => {
      const search = filters().search.toLowerCase().trim();
      if (!search) return reports();
      return reports().filter(
        (r) => r.title.toLowerCase().includes(search) || r.type.toLowerCase().includes(search),
      );
    }),
  })),

  withMethods((store, reportService = inject(ReportService), globalStore = inject(Store)) => ({
    setFilter: (partial: Partial<ReportFilters>) => {
      patchState(store, { filters: { ...store.filters(), ...partial } });
    },

    resetFilters: () => {
      patchState(store, { filters: { ...initialFilters } });
    },

    loadReports: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return of([]);
          const { type, status } = store.filters();
          return reportService.queryByUser(user.id, { type, status });
        }),
        tapResponse({
          next: (reports) => patchState(store, { reports, loading: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to load reports',
              loading: false,
            }),
        }),
      ),
    ),

    createReport: rxMethod<CreateReportPayload>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((payload) => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return of(null);

          const dateFrom = Timestamp.fromDate(new Date(payload.dateFrom));
          const dateTo = Timestamp.fromDate(new Date(payload.dateTo + 'T23:59:59'));

          return reportService.create({
            userId: user.id,
            title: payload.title,
            type: payload.type,
            status: 'generating',
            filters: {
              dateFrom,
              dateTo,
              accountIds: payload.accountIds?.length ? payload.accountIds : undefined,
              currencies: payload.currencies?.length ? (payload.currencies as any) : undefined,
            },
          } as any);
        }),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to create report',
              saving: false,
            }),
        }),
      ),
    ),

    deleteReport: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap((id) => reportService.delete(id)),
        tapResponse({
          next: () => patchState(store, { saving: false }),
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to delete report',
              saving: false,
            }),
        }),
      ),
    ),

    downloadReport: rxMethod<Report>(
      pipe(
        switchMap((report) => reportService.downloadReport(report)),
        tapResponse({
          next: () => {},
          error: (err: any) =>
            patchState(store, {
              error: err.message || 'Failed to download report',
            }),
        }),
      ),
    ),
  })),
);
