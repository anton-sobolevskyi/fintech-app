import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { DataSourceService } from './data-source.service';

vi.mock('firebase/firestore', () => ({
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  orderBy: vi.fn((field: string, dir: string) => ({ orderBy: field, dir })),
  limit: vi.fn((n: number) => ({ limit: n })),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

describe('DataSourceService', () => {
  let service: DataSourceService;
  let getAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataSourceService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(DataSourceService);
    getAll = vi.spyOn(service as unknown as { getAll: (constraints?: unknown[]) => unknown }, 'getAll').mockReturnValue(of([]));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllSources should order by name asc', () => {
    service.getAllSources().subscribe();
    expect(getAll).toHaveBeenCalledWith([{ orderBy: 'name', dir: 'asc' }]);
  });

  it('getByCloudType should filter by cloud type', () => {
    service.getByCloudType('public').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'cloudType', op: '==', value: 'public' },
      { orderBy: 'name', dir: 'asc' },
    ]);
  });

  it('getHealthy should filter by healthy status', () => {
    service.getHealthy().subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'status', op: '==', value: 'healthy' },
      { orderBy: 'name', dir: 'asc' },
    ]);
  });

  it('querySources should add filters when provided', () => {
    service.querySources({ cloudType: 'private', status: 'down' }).subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'cloudType', op: '==', value: 'private' },
      { field: 'status', op: '==', value: 'down' },
      { orderBy: 'name', dir: 'asc' },
    ]);
  });

  it('querySources should keep only the orderBy when no filters are given', () => {
    service.querySources({ cloudType: null, status: undefined }).subscribe();
    expect(getAll).toHaveBeenCalledWith([{ orderBy: 'name', dir: 'asc' }]);
  });
});
