import { FieldValue, Timestamp } from 'firebase/firestore';
import { ID } from './common.model';

export type CloudType = 'public' | 'private';
export type SourceStatus = 'healthy' | 'degraded' | 'down' | 'maintenance';

export interface DataSource {
  id: ID;
  name: string;
  cloudType: CloudType;
  status: SourceStatus;
  region: string;
  description?: string;
  latencyMs?: number;
  errorRate?: number;
  lastSyncAt?: Timestamp | FieldValue;
  createdAt?: Timestamp;
}
