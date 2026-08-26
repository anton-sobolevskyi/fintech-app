import { Timestamp } from "firebase/firestore";

export type ReportType = 'balance' | 'transactions' | 'performance' | 'custom';
export type ReportStatus = 'generating' | 'ready' | 'failed';

export interface Report {
  id: string;
  userId: string;
  title: string;
  type: ReportType;
  filters: {
    dateFrom: Timestamp;
    dateTo: Timestamp;
    accountIds?: string[];
    currencies?: string[];
  };
  createdAt: Timestamp;
  status: ReportStatus;
  downloadUrl?: string;
}
