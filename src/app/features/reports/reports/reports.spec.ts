import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reports } from './reports';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { ReportService } from '@core/services/report.service';
import { of } from 'rxjs';

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        {
          provide: ReportService,
          useValue: {
            queryByUser: () => of([]),
            create: () => of('id'),
            delete: () => of('id'),
            downloadReport: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadReports on init and open create dialog', () => {
    const spy = vi.spyOn(component.store, 'loadReports');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
    component.openCreate();
    expect(component.showDialog()).toBe(true);
  });

  it('should save and close dialog', () => {
    const spy = vi.spyOn(component.store, 'createReport');
    const payload = { title: 'T' } as never;
    component.onSave(payload);
    expect(spy).toHaveBeenCalledWith(payload);
    expect(component.showDialog()).toBe(false);
  });

  it('should apply type/status/search filters', () => {
    const setSpy = vi.spyOn(component.store, 'setFilter');
    const loadSpy = vi.spyOn(component.store, 'loadReports');
    component.onTypeFilter('balance');
    expect(setSpy).toHaveBeenCalledWith({ type: 'balance' });
    component.onStatusFilter('ready');
    expect(setSpy).toHaveBeenCalledWith({ status: 'ready' });
    component.onSearch('monthly');
    expect(setSpy).toHaveBeenCalledWith({ search: 'monthly' });
    component.clearFilters();
    expect(loadSpy).toHaveBeenCalledTimes(3);
  });

  it('should delegate download and delete via confirmation', () => {
    const dlSpy = vi.spyOn(component.store, 'downloadReport');
    const report = { id: 'r1', title: 'R' } as never;
    component.onDownload(report);
    expect(dlSpy).toHaveBeenCalledWith(report);

    const delSpy = vi.spyOn(component.store, 'deleteReport');
    let accepted: (() => void) | undefined;
    vi.spyOn(
      (component as unknown as { confirmation: { confirm: (opts: unknown) => void } })
        .confirmation,
      'confirm',
    ).mockImplementation((opts: unknown) => {
      accepted = (opts as { accept: () => void }).accept;
    });
    component.onDelete(report);
    accepted?.();
    expect(delSpy).toHaveBeenCalledWith('r1');
  });

  it('should map status severity and format dates', () => {
    expect(component.getStatusSeverity('ready')).toBe('success');
    expect(component.getStatusSeverity('generating')).toBe('warn');
    expect(component.getStatusSeverity('failed')).toBe('danger');
    expect(component.getStatusSeverity('other')).toBe('info');
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate(new Date('2024-03-01T12:00:00'))).toContain('2024');
    expect(
      component.formatDate({ toDate: () => new Date('2024-03-02T12:00:00') } as never),
    ).toContain('2024');
  });

  it('should render report rows and empty state', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, {
      reports: [
        {
          id: 'r1',
          title: 'Monthly',
          type: 'transactions',
          status: 'ready',
          storagePath: 'p',
          createdAt: new Date('2024-03-01T12:00:00'),
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Monthly');

    patchState(component.store as never, { reports: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reports');
  });
});
