import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'debit' | 'credit' | 'transfer' | 'fee' | 'interest';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  counterpartyName?: string;
  counterpartyIban?: string;
  reference?: string;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  metadata?: Record<string, any>;
}
