import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Notification } from '../models';
import { Observable } from 'rxjs';

@Service()
export class NotificationService extends FirestoreService<Notification> {
  protected collectionName = 'notifications';

  getByUserId(userId: string): Observable<Notification[]> {
    return this.getAll([this.where('userId', '==', userId), this.orderBy('createdAt', 'desc')]);
  }

  getUnread(userId: string): Observable<Notification[]> {
    return this.getAll([
      this.where('userId', '==', userId),
      this.where('read', '==', false),
      this.orderBy('createdAt', 'desc'),
    ]);
  }
}
