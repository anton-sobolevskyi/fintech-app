import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase';
import { FirestoreService, PagedResult } from './firestore.service';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  getStorage: vi.fn(),
  connectStorageEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  uploadBytesResumable: vi.fn(),
}));

interface TestEntity {
  id: string;
  name?: string;
}

class TestService extends FirestoreService<TestEntity> {
  protected collectionName = 'items';

  queryBy(field: string, value: string) {
    return this.getAll([this.where(field, '==', value)]);
  }

  sorted(max: number) {
    return this.getAll([this.orderBy('createdAt', 'desc'), this.limitTo(max)]);
  }
}

const docs = (entries: Array<{ id: string; name: string }>) =>
  entries.map(({ id, name }) => ({ id, data: () => ({ name }) }));

describe('FirestoreService', () => {
  let service: TestService;

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.collection.mockReturnValue({ collection: true });
    firestoreMocks.doc.mockReturnValue({ doc: true });
    firestoreMocks.query.mockImplementation((...args) => args[1] ?? []);
    firestoreMocks.where.mockImplementation((field, op, value) => ({ field, op, value }));
    firestoreMocks.orderBy.mockImplementation((field, dir) => ({ orderBy: field, dir }));
    firestoreMocks.limit.mockImplementation((n) => ({ limit: n }));
    firestoreMocks.startAfter.mockImplementation(() => ({ startAfter: true }));
    firestoreMocks.serverTimestamp.mockReturnValue({ serverTimestamp: true });
    firestoreMocks.onSnapshot.mockImplementation(() => vi.fn());
    firestoreMocks.getDocs.mockResolvedValue(Promise.resolve({ docs: [] }));
    firestoreMocks.addDoc.mockResolvedValue({ id: 'new-id' });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });

    TestBed.configureTestingModule({
      providers: [
        TestService,
        { provide: FIRESTORE, useValue: {} },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });
    service = TestBed.inject(TestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should emit documents mapped with their id', () => {
      const src = { source: 'items' };
      firestoreMocks.query.mockReturnValue(src);
      let next!: (snapshot: { docs: ReturnType<typeof docs> }) => void;
      firestoreMocks.onSnapshot.mockImplementation((_q, handler, _err) => {
        next = handler;
        return () => undefined;
      });

      const results: TestEntity[] = [];
      service.getAll().subscribe((value) => results.push(...value));
      next!({ docs: docs([{ id: 'a', name: 'A' }]) });

      expect(firestoreMocks.collection).toHaveBeenCalledWith({}, 'items');
      expect(firestoreMocks.onSnapshot).toHaveBeenCalled();
      expect(results).toEqual([{ id: 'a', name: 'A' }]);
    });

    it('should forward snapshot errors to the subscriber', () => {
      let onError!: (err: unknown) => void;
      firestoreMocks.onSnapshot.mockImplementation((_q, _next, err: (e: unknown) => void) => {
        onError = err;
        return () => undefined;
      });

      const errors: unknown[] = [];
      service.getAll().subscribe({ error: (e) => errors.push(e) });
      onError!('boom');
      expect(errors).toEqual(['boom']);
    });

    it('should call the unsubscribe function when the subscription is cancelled', () => {
      const unsubscribe = vi.fn();
      firestoreMocks.onSnapshot.mockReturnValue(unsubscribe);
      const sub = service.getAll().subscribe();
      sub.unsubscribe();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should emit the document when it exists', () => {
      let next!: (snapshot: { exists: () => boolean; id: string; data: () => object }) => void;
      firestoreMocks.onSnapshot.mockImplementation((_q, handler) => {
        next = handler;
        return () => undefined;
      });
      const results: (TestEntity | undefined)[] = [];
      service.getById('a').subscribe((value) => results.push(value));
      next!({ exists: () => true, id: 'a', data: () => ({ name: 'A' }) });
      expect(results).toEqual([{ id: 'a', name: 'A' }]);
    });

    it('should emit undefined when the document does not exist', () => {
      let next!: (snapshot: { exists: () => boolean }) => void;
      firestoreMocks.onSnapshot.mockImplementation((_q, handler) => {
        next = handler;
        return () => undefined;
      });
      const results: (TestEntity | undefined)[] = [];
      service.getById('missing').subscribe((value) => results.push(value));
      next!({ exists: () => false });
      expect(results).toEqual([undefined]);
    });
  });

  describe('getPage', () => {
    it('should return a page and flag hasMore when more items exist', async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: docs(Array.from({ length: 21 }, (_, i) => ({ id: `d${i}`, name: `D${i}` }))),
      });

      const result = await new Promise<PagedResult<TestEntity>>((resolve) => {
        service.getPage(20).subscribe((r) => resolve(r));
      });

      expect(firestoreMocks.limit).toHaveBeenCalledWith(21);
      expect(firestoreMocks.startAfter).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.lastDoc).toBeDefined();
    });

    it('should return the exact page and hasMore false when the page fits', async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: docs([
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ]),
      });

      const result = await new Promise<PagedResult<TestEntity>>((resolve) => {
        service.getPage(5).subscribe(resolve);
      });
      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should start after the provided lastDoc', async () => {
      firestoreMocks.getDocs.mockResolvedValue({ docs: docs([{ id: 'a', name: 'A' }]) });
      const lastDoc = { id: 'd19' } as never;
      await new Promise<void>((resolve) => {
        service.getPage(20, [], lastDoc).subscribe(() => resolve());
      });
      expect(firestoreMocks.startAfter).toHaveBeenCalledWith(lastDoc);
      expect(firestoreMocks.limit).toHaveBeenCalledWith(21);
    });
  });

  describe('write operations', () => {
    it('create should add the document and return its id', async () => {
      const id = await new Promise<string>((resolve) => {
        service.create({ name: 'A' }).subscribe(resolve);
      });
      expect(firestoreMocks.serverTimestamp).toHaveBeenCalled();
      expect(firestoreMocks.addDoc).toHaveBeenCalledWith({ collection: true }, {
        name: 'A',
        createdAt: { serverTimestamp: true },
      });
      expect(id).toBe('new-id');
    });

    it('set should write the document with a server timestamp', async () => {
      await new Promise<void>((resolve) => {
        service.set('a', { name: 'A' }).subscribe(() => resolve());
      });
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith({ doc: true }, {
        name: 'A',
        createdAt: { serverTimestamp: true },
      });
    });

    it('update should write a partial document with an updatedAt timestamp', async () => {
      await new Promise<void>((resolve) => {
        service.update('a', { name: 'B' }).subscribe(() => resolve());
      });
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith({ doc: true }, {
        name: 'B',
        updatedAt: { serverTimestamp: true },
      });
    });

    it('delete should remove the document and return its id', async () => {
      const id = await new Promise<string>((resolve) => {
        service.delete('a').subscribe(resolve);
      });
      expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ doc: true });
      expect(id).toBe('a');
    });
  });

  describe('query helpers', () => {
    it('should build a where constraint', () => {
      let next!: (snapshot: { docs: unknown[] }) => void;
      firestoreMocks.onSnapshot.mockImplementation((_q, handler) => {
        next = handler;
        return () => undefined;
      });
      firestoreMocks.query.mockImplementation((...args: unknown[]) => args[1]);
      service.queryBy('name', 'A').subscribe();
      next({ docs: [] });
      const constraints = firestoreMocks.query.mock.calls[0].slice(1) as unknown[];
      expect(constraints).toEqual([{ field: 'name', op: '==', value: 'A' }]);
    });

    it('should build orderBy and limit constraints', () => {
      firestoreMocks.onSnapshot.mockImplementation(() => () => undefined);
      firestoreMocks.query.mockImplementation((...args: unknown[]) => args[1]);
      service.sorted(10).subscribe();
      const constraints = firestoreMocks.query.mock.calls[0].slice(1) as unknown[];
      expect(constraints).toEqual([
        { orderBy: 'createdAt', dir: 'desc' },
        { limit: 10 },
      ]);
    });
  });
});
