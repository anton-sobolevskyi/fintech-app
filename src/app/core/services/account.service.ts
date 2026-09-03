import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable, switchMap, map, from } from 'rxjs';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { generateUaIban } from '@core/utils/iban.utils';
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

  createWithUniqueIban(data: Omit<Account, 'id' | 'createdAt' | 'iban'>): Observable<string> {
    const attempt = (triesLeft: number): Observable<string> => {
      const seed = `${data.userId}-${data.name}-${Date.now()}-${triesLeft}`;
      const iban = generateUaIban(seed);

      return from(
        getDocs(
          query(
            collection(this.firestore, this.collectionName),
            where('iban', '==', iban),
            limit(1),
          ),
        ),
      ).pipe(
        switchMap((snap) => {
          if (!snap.empty && triesLeft > 0) {
            return attempt(triesLeft - 1);
          }
          if (!snap.empty) {
            throw new Error('Could not allocate unique IBAN');
          }
          return this.create({ ...data, iban } as Omit<Account, 'id' | 'createdAt'>);
        }),
      );
    };

    return attempt(3);
  }
}
