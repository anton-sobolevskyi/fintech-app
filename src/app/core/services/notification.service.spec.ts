import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { NotificationService } from './notification.service';

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

describe('NotificationService', () => {
  let service: NotificationService;
  let getAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(NotificationService);
    getAll = vi.spyOn(service as unknown as { getAll: (constraints?: unknown[]) => unknown }, 'getAll').mockReturnValue(of([]));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getByUserId should filter and order notifications', () => {
    service.getByUserId('u1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });

  it('getUnread should filter by unread flag', () => {
    service.getUnread('u1').subscribe();
    expect(getAll).toHaveBeenCalledWith([
      { field: 'userId', op: '==', value: 'u1' },
      { field: 'read', op: '==', value: false },
      { orderBy: 'createdAt', dir: 'desc' },
    ]);
  });
});
