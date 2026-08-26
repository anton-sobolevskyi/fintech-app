import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { DataSource } from '../models';
import { Observable } from 'rxjs';

@Service()
export class DataSourceService extends FirestoreService<DataSource> {
  protected collectionName = 'dataSources';

  getByCloudType(cloudType: 'private' | 'public'): Observable<DataSource[]> {
    return this.getAll([this.where('cloudType', '==', cloudType), this.orderBy('name', 'asc')]);
  }

  getHealthy(): Observable<DataSource[]> {
    return this.getAll([this.where('status', '==', 'healthy'), this.orderBy('name', 'asc')]);
  }
}
