import { Injectable, inject } from '@angular/core';
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
  CollectionReference,
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

@Injectable()
export abstract class FirestoreService<T extends FirestoreEntity> {
  protected firestore = inject(FIRESTORE);
  protected abstract collectionName: string;

  private get collectionRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.collectionName);
  }

  /** Real-time stream of a collection query, manually wrapped from onSnapshot */
  getAll(constraints: QueryConstraint[] = []): Observable<T[]> {
    const q = query(this.collectionRef, ...constraints);

    return new Observable<T[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
          subscriber.next(items);
        },
        (error) => subscriber.error(error),
      );
      return unsubscribe; // Firestore's unsubscribe fn is called on Observable teardown
    });
  }

  /** Real-time stream of a single document */
  getById(id: string): Observable<T | undefined> {
    const ref = doc(this.firestore, this.collectionName, id);

    return new Observable<T | undefined>((subscriber) => {
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          subscriber.next(
            snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : undefined,
          );
        },
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  /**
   * One-time paginated fetch (not real-time — appropriate for history/list views).
   * Pass `lastDoc` from the previous page to get the next page.
   */
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

  create(data: Omit<T, 'id'>): Observable<string> {
    const payload = { ...data, createdAt: serverTimestamp() };
    return from(addDoc(this.collectionRef, payload).then((ref) => ref.id));
  }

  set(id: string, data: Omit<T, 'id'>): Observable<void> {
    const ref = doc(this.firestore, this.collectionName, id);
    return from(setDoc(ref, { ...data, updatedAt: serverTimestamp() }));
  }

  update(id: string, data: Partial<Omit<T, 'id'>>): Observable<void> {
    const ref = doc(this.firestore, this.collectionName, id);
    return from(updateDoc(ref, { ...data, updatedAt: serverTimestamp() }));
  }

  delete(id: string): Observable<void> {
    const ref = doc(this.firestore, this.collectionName, id);
    return from(deleteDoc(ref));
  }

  protected where(field: string, op: WhereFilterOp, value: unknown): QueryConstraint {
    return where(field, op, value);
  }

  protected orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
    return orderBy(field, direction);
  }
}

type WhereFilterOp =
  '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
