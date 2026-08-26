import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Report } from '../models';
import { Observable } from 'rxjs';

@Service()
export class ReportService extends FirestoreService<Report> {
  protected collectionName = 'reports';

  getByUserId(userId: string): Observable<Report[]> {
    return this.getAll([this.where('userId', '==', userId), this.orderBy('createdAt', 'desc')]);
  }
}
