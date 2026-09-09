import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { Report } from '../models';
import { ReportService } from './report.service';

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

const storageMocks = vi.hoisted(() => ({
  ref: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('firebase/storage', () => storageMocks);

const report: Report = {
  id: 'r1',
  userId: 'u1',
  title: 'Statement',
  type: 'transactions',
  status: 'ready',
  storagePath: 'reports/u1/r1.pdf',
  filters: { dateFrom: undefined as never, dateTo: undefined as never },
};

describe('ReportService', () => {
  let service: ReportService;
  let getAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.ref.mockReturnValue({ ref: 'path' });
    storageMocks.getDownloadURL.mockResolvedValue('https://download/report');
    TestBed.configureTestingModule({
      providers: [
        ReportService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(ReportService);
    getAll = vi.spyOn(service as unknown as { getAll: (constraints?: unknown[]) => unknown }, 'getAll').mockReturnValue(of([]));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getByUserId should filter and order reports', () => {
    service.getByUserId('u1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });

  it('queryByUser should add type/status filters when provided', () => {
    service.queryByUser('u1', { type: 'balance', status: 'ready' }).subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { field: 'type', op: '==', value: 'balance' },
      { field: 'status', op: '==', value: 'ready' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });

  it('queryByUser should omit absent filters', () => {
    service.queryByUser('u1', { type: null, status: null }).subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });

  describe('downloadReport', () => {
    it('should open the resolved download URL', async () => {
      const openSpy = vi.fn();
      Object.defineProperty(window, 'open', { writable: true, value: openSpy });
      await service.downloadReport(report);
      expect(storageMocks.ref).toHaveBeenCalledWith({}, 'reports/u1/r1.pdf');
      expect(storageMocks.getDownloadURL).toHaveBeenCalledWith({ ref: 'path' });
      expect(openSpy).toHaveBeenCalledWith('https://download/report', '_blank');
    });

    it('should log and swallow errors when the URL cannot be resolved', async () => {
      storageMocks.getDownloadURL.mockRejectedValue(new Error('no'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await service.downloadReport(report);
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
