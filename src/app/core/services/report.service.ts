import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Report, ReportType, ReportStatus } from '../models';
import { Observable } from 'rxjs';
import { QueryConstraint } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';

@Service()
export class ReportService extends FirestoreService<Report> {
  protected collectionName = 'reports';

  getByUserId(userId: string): Observable<Report[]> {
    return this.getAll([this.where('userId', '==', userId), this.orderBy('createdAt', 'desc')]);
  }

  queryByUser(
    userId: string,
    filters: { type?: ReportType | null; status?: ReportStatus | null },
  ): Observable<Report[]> {
    const constraints: QueryConstraint[] = [this.where('userId', '==', userId)];

    if (filters.type) constraints.push(this.where('type', '==', filters.type));
    if (filters.status) constraints.push(this.where('status', '==', filters.status));

    constraints.push(this.orderBy('createdAt', 'desc'));
    return this.getAll(constraints);
  }

  async downloadReport(report: Report): Promise<void> {
    try {
      const path = report.storagePath ?? `reports/${report.userId}/${report.id}.pdf`;

      const url = await getDownloadURL(ref(this.storage, path));
      window.open(url, '_blank');
    } catch (e) {
      console.error('Download failed', e);
    }
  }
}
