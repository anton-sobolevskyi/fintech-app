import { Service } from '@angular/core';
import { FirestoreService, PagedResult } from './firestore.service';
import { Transaction } from '../models';
import { Observable } from 'rxjs';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

@Service()
export class TransactionService extends FirestoreService<Transaction> {
  protected collectionName = 'transactions';

  getByUserId(userId: string, max = 50): Observable<Transaction[]> {
    return this.getAll([
      this.where('userId', '==', userId),
      this.orderBy('createdAt', 'desc'),
      this.limitTo(max),
    ]);
  }

  getByAccountId(accountId: string, max = 50): Observable<Transaction[]> {
    return this.getAll([
      this.where('accountId', '==', accountId),
      this.orderBy('createdAt', 'desc'),
      this.limitTo(max),
    ]);
  }

  getByUserIdPaginated(
    userId: string,
    pageSize = 20,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  ): Observable<PagedResult<Transaction>> {
    return this.getPage(
      pageSize,
      [this.where('userId', '==', userId), this.orderBy('createdAt', 'desc')],
      lastDoc,
    );
  }

  getByStatus(userId: string, status: string): Observable<Transaction[]> {
    return this.getAll([
      this.where('userId', '==', userId),
      this.where('status', '==', status),
      this.orderBy('createdAt', 'desc'),
    ]);
  }
}
