import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { DataSource, CloudType, SourceStatus } from '../models';
import { Observable } from 'rxjs';
import { QueryConstraint } from 'firebase/firestore';

@Service()
export class DataSourceService extends FirestoreService<DataSource> {
  protected collectionName = 'dataSources';

  getAllSources(): Observable<DataSource[]> {
    return this.getAll([this.orderBy('name', 'asc')]);
  }

  getByCloudType(cloudType: CloudType): Observable<DataSource[]> {
    return this.getAll([this.where('cloudType', '==', cloudType), this.orderBy('name', 'asc')]);
  }

  getHealthy(): Observable<DataSource[]> {
    return this.getAll([this.where('status', '==', 'healthy'), this.orderBy('name', 'asc')]);
  }

  querySources(filters: {
    cloudType?: CloudType | null;
    status?: SourceStatus | null;
  }): Observable<DataSource[]> {
    const constraints: QueryConstraint[] = [];

    if (filters.cloudType) {
      constraints.push(this.where('cloudType', '==', filters.cloudType));
    }
    if (filters.status) {
      constraints.push(this.where('status', '==', filters.status));
    }

    constraints.push(this.orderBy('name', 'asc'));
    return this.getAll(constraints);
  }
}
