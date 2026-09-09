import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataSources } from './data-sources';
import { DataSourceService } from '@core/services/data-source.service';
import { of } from 'rxjs';

describe('DataSources', () => {
  let component: DataSources;
  let fixture: ComponentFixture<DataSources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSources],
      providers: [
        {
          provide: DataSourceService,
          useValue: {
            querySources: () => of([]),
            create: () => of('id'),
            update: () => of(null),
            delete: () => of('id'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataSources);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadSources on init', () => {
    const spy = vi.spyOn(component.store, 'loadSources');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should open create dialog with null editing source', () => {
    component.openCreate();
    expect(component.editingSource()).toBeNull();
    expect(component.showDialog()).toBe(true);
  });

  it('should open edit dialog with the source', () => {
    const source = { id: 's1', name: 'A' } as never;
    component.openEdit(source);
    expect(component.editingSource()).toBe(source);
    expect(component.showDialog()).toBe(true);
  });

  it('should update when editing and create otherwise on save', () => {
    const updateSpy = vi.spyOn(component.store, 'updateSource');
    const createSpy = vi.spyOn(component.store, 'createSource');
    component.editingSource.set({ id: 's1' } as never);
    component.onSave({ name: 'x' } as never);
    expect(updateSpy).toHaveBeenCalledWith({ id: 's1', data: { name: 'x' } as never });
    expect(component.showDialog()).toBe(false);

    component.editingSource.set(null);
    component.onSave({ name: 'y' } as never);
    expect(createSpy).toHaveBeenCalled();
  });

  it('should delegate sync to the store', () => {
    const spy = vi.spyOn(component.store, 'syncSource');
    component.onSync({ id: 's1' } as never);
    expect(spy).toHaveBeenCalledWith('s1');
  });

  it('should set cloud/status filters and reload', () => {
    const setSpy = vi.spyOn(component.store, 'setFilter');
    const loadSpy = vi.spyOn(component.store, 'loadSources');
    component.onCloudChange('private');
    expect(setSpy).toHaveBeenCalledWith({ cloudType: 'private' });
    expect(loadSpy).toHaveBeenCalled();
    component.onStatusChange('down');
    expect(setSpy).toHaveBeenCalledWith({ status: 'down' });
    component.onSearch('alpha');
    expect(setSpy).toHaveBeenCalledWith({ search: 'alpha' });
    component.clearFilters();
    expect(loadSpy).toHaveBeenCalledTimes(3);
  });

  it('should map status and cloud severities', () => {
    expect(component.getStatusSeverity('healthy')).toBe('success');
    expect(component.getStatusSeverity('degraded')).toBe('warn');
    expect(component.getStatusSeverity('down')).toBe('danger');
    expect(component.getStatusSeverity('maintenance')).toBe('info');
    expect(component.getStatusSeverity('other')).toBe('info');
    expect(component.getCloudSeverity('private')).toBe('secondary');
    expect(component.getCloudSeverity('public')).toBe('info');
  });

  it('should format dates and handle undefined', () => {
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate(new Date('2024-01-15T10:00:00'))).toContain('січ');
    expect(
      component.formatDate({ toDate: () => new Date('2024-02-01T10:00:00') } as never),
    ).toContain('лют');
  });

  it('should render source rows and empty state', async () => {
    const { patchState } = await import('@ngrx/signals');
    patchState(component.store as never, {
      sources: [
        {
          id: 's1',
          name: 'Alpha',
          cloudType: 'public',
          status: 'healthy',
          region: 'eu-west',
          description: 'main',
          lastSyncAt: new Date('2024-01-15T10:00:00'),
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Alpha');

    patchState(component.store as never, { sources: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Data Sources');
  });
});
