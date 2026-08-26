import { Timestamp } from 'firebase/firestore';

export type CloudType = 'private' | 'public';
export type SourceStatus = 'healthy' | 'degraded' | 'down' | 'maintenance';

export interface DataSource {
  id: string;
  name: string;
  cloudType: CloudType;
  status: SourceStatus;
  lastSyncAt?: Timestamp;
  latencyMs: number;
  errorRate: number;
  region: string;
  description?: string;
}
