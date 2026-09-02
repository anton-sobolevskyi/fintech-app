import { inject } from '@angular/core';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
} from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase';

export interface FirestoreEntity {
  id: string;
}

export interface PagedResult<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export abstract class FirestoreService<T extends FirestoreEntity> {
  protected firestore = inject(FIRESTORE);
  protected abstract collectionName: string;

  private get collectionRef() {
    return collection(this.firestore, this.collectionName);
  }

  private docRef(id: string) {
    return doc(this.firestore, this.collectionName, id);
  }

  getAll(constraints: QueryConstraint[] = []): Observable<T[]> {
    const q = query(this.collectionRef, ...constraints);
    return new Observable<T[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => subscriber.next(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  getById(id: string): Observable<T | undefined> {
    return new Observable<T | undefined>((subscriber) => {
      const unsubscribe = onSnapshot(
        this.docRef(id),
        (snapshot) =>
          subscriber.next(
            snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : undefined,
          ),
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  getPage(
    pageSize: number,
    constraints: QueryConstraint[] = [],
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  ): Observable<PagedResult<T>> {
    const pageConstraints = lastDoc
      ? [...constraints, startAfter(lastDoc), limit(pageSize + 1)]
      : [...constraints, limit(pageSize + 1)];
    const q = query(this.collectionRef, ...pageConstraints);

    return from(getDocs(q)).pipe(
      map((snapshot) => {
        const docs = snapshot.docs;
        const hasMore = docs.length > pageSize;
        const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;
        return {
          items: pageDocs.map((d) => ({ id: d.id, ...d.data() }) as T),
          lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
          hasMore,
        };
      }),
    );
  }

  create(data: Omit<T, 'id' | 'createdAt'>): Observable<string> {
    const payload = { ...data, createdAt: serverTimestamp() };
    return from(addDoc(this.collectionRef, payload).then((ref) => ref.id));
  }

  set(id: string, data: Omit<T, 'id' | 'createdAt'>): Observable<void> {
    const payload = { ...data, createdAt: serverTimestamp() };
    return from(setDoc(this.docRef(id), payload));
  }

  update(id: string, data: Partial<Omit<T, 'id'>>): Observable<void> {
    return from(updateDoc(this.docRef(id), { ...data, updatedAt: serverTimestamp() } as any));
  }

  delete(id: string): Observable<string> {
    return from(deleteDoc(this.docRef(id))).pipe(map(() => id));
  }

  protected where(field: string, op: WhereFilterOp, value: unknown): QueryConstraint {
    return where(field, op, value);
  }

  protected orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
    return orderBy(field, direction);
  }

  protected limitTo(count: number): QueryConstraint {
    return limit(count);
  }
}

type WhereFilterOp =
  '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
