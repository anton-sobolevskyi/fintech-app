import { Timestamp } from 'firebase/firestore';
import { ID } from './common.model';

export type CloudType = 'private' | 'public';
export type SourceStatus = 'healthy' | 'degraded' | 'down' | 'maintenance';

export interface DataSource {
  id: ID;
  name: string;
  cloudType: CloudType;
  status: SourceStatus;
  lastSyncAt?: Timestamp;
  latencyMs: number;
  errorRate: number;
  region: string;
  description?: string;
}
