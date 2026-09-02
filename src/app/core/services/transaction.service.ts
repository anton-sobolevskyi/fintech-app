// core/services/transaction.service.ts
import { Service } from '@angular/core';
import { FirestoreService, PagedResult } from './firestore.service';
import { Transaction } from '../models';
import { Observable } from 'rxjs';
import { QueryDocumentSnapshot, DocumentData, QueryConstraint } from 'firebase/firestore';

export interface TransactionQueryFilters {
  type?: string | null;
  status?: string | null;
  accountId?: string | null;
}

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
    filters: TransactionQueryFilters = {},
  ): Observable<PagedResult<Transaction>> {
    const constraints: QueryConstraint[] = [this.where('userId', '==', userId)];

    if (filters.type) {
      constraints.push(this.where('type', '==', filters.type));
    }
    if (filters.status) {
      constraints.push(this.where('status', '==', filters.status));
    }
    if (filters.accountId) {
      constraints.push(this.where('accountId', '==', filters.accountId));
    }

    constraints.push(this.orderBy('createdAt', 'desc'));

    return this.getPage(pageSize, constraints, lastDoc);
  }

  getByStatus(userId: string, status: string): Observable<Transaction[]> {
    return this.getAll([
      this.where('userId', '==', userId),
      this.where('status', '==', status),
      this.orderBy('createdAt', 'desc'),
    ]);
  }
}
