import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { ReportService } from '../../core/services/report.service';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';

interface ReportsState {
  reports: Report[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  reports: [],
  loading: false,
  error: null,
};

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
  })),
);
