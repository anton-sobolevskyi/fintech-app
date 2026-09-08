import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable, map } from 'rxjs';
import { Account } from '../models';

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

  getByIban(iban: string): Observable<Account | undefined> {
    const normalized = iban.replace(/\s/g, '').toUpperCase();
    return this.getAll([this.where('iban', '==', normalized), this.limitTo(1)]).pipe(
      map((list) => list[0]),
    );
  }
}
