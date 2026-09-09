import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { UserService } from './user.service';

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

describe('UserService', () => {
  let service: UserService;
  let getAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(UserService);
    getAll = vi.spyOn(service as unknown as { getAll: (constraints?: unknown[]) => unknown }, 'getAll').mockReturnValue(of([]));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllUsers should order by createdAt desc', () => {
    service.getAllUsers().subscribe();
    expect(getAll).toHaveBeenCalledWith([{ orderBy: 'createdAt', dir: 'desc' }]);
  });

  it('getByRole should filter by role', () => {
    service.getByRole('admin').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'role', op: '==', value: 'admin' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });
});
