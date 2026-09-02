import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, delay, map } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { Timestamp } from 'firebase/firestore';
import { ReportType, Report, Currency, ID } from '@core/models';
import { ReportService } from '@core/services/report.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';

interface ReportsState {
  reports: Report[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  reports: [],
  loading: false,
  saving: false,
  error: null,
};

export interface CreateReportPayload {
  title: string;
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  accountIds: ID[];
  currencies: Currency[];
}

export const ReportsStore = signalStore(
  withState(initialState),

  withMethods((store, reportService = inject(ReportService), globalStore = inject(Store)) => ({
    loadReports: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const user = globalStore.selectSignal(selectCurrentUser)();
          if (!user) return of([]);
          return reportService.getByUserId(user.id);
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

          const data: Omit<Report, 'id' | 'createdAt'> = {
            userId: user.id,
            title: payload.title,
            type: payload.type,
            status: 'generating' as const,
            filters: {
              dateFrom,
              dateTo,
              accountIds: payload.accountIds?.length ? payload.accountIds : undefined,
              currencies: payload.currencies?.length ? payload.currencies : undefined,
            },
          };

          return reportService.create(data).pipe(
            delay(1500),
            switchMap((id) =>
              reportService
                .update(id, {
                  status: 'ready',
                  // placeholder; later replace with Storage URL
                  downloadUrl: `https://example.com/reports/${id}.pdf`,
                })
                .pipe(map(() => id)),
            ),
          );
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

    clearError: () => patchState(store, { error: null }),
  })),
);
