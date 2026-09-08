import { Service } from '@angular/core';
import { filter, Observable, Subject } from 'rxjs';

export type AppEventType =
  | 'account.created'
  | 'account.topup'
  | 'account.transfer'
  | 'account.updated'
  | 'transactions.changed';

export interface AppEvent<T extends AppEventType = AppEventType> {
  type: T;
  payload?: Record<string, unknown>;
  at: number;
}

@Service()
export class EventService {
  private readonly events$ = new Subject<AppEvent>();

  readonly stream$ = this.events$.asObservable();

  emit(type: AppEventType, payload?: Record<string, unknown>): void {
    this.events$.next({ type, payload, at: Date.now() });
  }

  on(...types: AppEventType[]): Observable<AppEvent> {
    const set = new Set(types);
    return this.stream$.pipe(filter((e) => set.has(e.type)));
  }
}
