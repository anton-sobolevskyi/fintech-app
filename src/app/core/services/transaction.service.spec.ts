import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { TransactionService } from './transaction.service';

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

describe('TransactionService', () => {
  let service: TransactionService;
  let getAll: ReturnType<typeof vi.fn>;
  let getPage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(TransactionService);
    getAll = vi.spyOn(service as unknown as { getAll: (constraints?: unknown[]) => unknown }, 'getAll').mockReturnValue(of([]));
    getPage = vi
      .spyOn(service as unknown as { getPage: (...args: unknown[]) => unknown }, 'getPage')
      .mockReturnValue(of({ items: [], lastDoc: null, hasMore: false }));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getByUserId should constrain by userId, order and cap at max', () => {
    service.getByUserId('u1', 25).subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
      { limit: 25 },
    ]);
  });

  it('getByUserId should use the default limit', () => {
    service.getByUserId('u1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
      { limit: 50 },
    ]);
  });

  it('getByAccountId should filter by accountId', () => {
    service.getByAccountId('acc-1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'accountId', op: '==', value: 'acc-1' },
      { orderBy: 'createdAt', dir: 'desc' },
      { limit: 50 },
    ]);
  });

  it('getByUserIdPaginated should pass type/status/accountId filters when present', () => {
    service
      .getByUserIdPaginated('u1', 20, null, { type: 'credit', status: 'completed', accountId: 'a' })
      .subscribe();
    expect(getPage).toHaveBeenCalledWith(20, [
      { field: 'userId', op: '==', value: 'u1' },
      { field: 'type', op: '==', value: 'credit' },
      { field: 'status', op: '==', value: 'completed' },
      { field: 'accountId', op: '==', value: 'a' },
      { orderBy: 'createdAt', dir: 'desc' },
    ], null);
  });

  it('getByUserIdPaginated should skip filters that are not provided', () => {
    service.getByUserIdPaginated('u1', 10, null, { type: null, status: undefined }).subscribe();
    expect(getPage).toHaveBeenCalledWith(10, [
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
    ], null);
  });

  it('getByStatus should filter by status', () => {
    service.getByStatus('u1', 'failed').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { field: 'status', op: '==', value: 'failed' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });
});
