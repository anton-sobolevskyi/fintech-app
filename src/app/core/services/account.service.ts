import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Account } from '../models';
import { Observable } from 'rxjs';

@Service()
export class AccountService extends FirestoreService<Account> {
  protected collectionName = 'accounts';

  getByUserId(userId: string): Observable<Account[]> {
    return this.getAll([this.where('userId', '==', userId), this.orderBy('createdAt', 'desc')]);
  }

  getActiveByUserId(userId: string): Observable<Account[]> {
    return this.getAll([
      this.where('userId', '==', userId),
      this.where('status', '==', 'active'),
      this.orderBy('createdAt', 'desc'),
    ]);
  }
}
