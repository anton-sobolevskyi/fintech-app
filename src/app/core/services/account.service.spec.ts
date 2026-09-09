import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { AccountService } from './account.service';

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

describe('AccountService', () => {
  let service: AccountService;
  let getAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(AccountService);
    getAll = vi.spyOn(service as unknown as { getAll: (constraints?: unknown[]) => unknown }, 'getAll').mockReturnValue(of([]));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getByUserId should query and order by createdAt desc', () => {
    service.getByUserId('u1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });

  it('getActiveByUserId should also filter by active status', () => {
    service.getActiveByUserId('u1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { field: 'status', op: '==', value: 'active' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });

  it('getByIban should normalize the IBAN and return the first match', () => {
    const list = [{ id: 'a', iban: 'UA123' }];
    getAll.mockReturnValue(of(list));
    let result: unknown;
    service.getByIban(' ua123 ').subscribe((value) => (result = value));
    expect(getAll).toHaveBeenCalledWith([
      { field: 'iban', op: '==', value: 'UA123' },
      { limit: 1 },
    ]);
    expect(result).toEqual(list[0]);
  });
});
