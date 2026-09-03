import { Timestamp } from 'firebase/firestore';
import { Currency, ID } from './common.model';

export type ReportType = 'balance' | 'transactions' | 'performance' | 'custom';
export type ReportStatus = 'generating' | 'ready' | 'failed';

export interface Report {
  id: ID;
  userId: ID;
  title: string;
  type: ReportType;
  filters: {
    dateFrom: Timestamp;
    dateTo: Timestamp;
    accountIds?: ID[];
    currencies?: Currency[];
  };
  createdAt?: Timestamp;
  status: ReportStatus;
  downloadUrl?: string;
  storagePath: string;
}
