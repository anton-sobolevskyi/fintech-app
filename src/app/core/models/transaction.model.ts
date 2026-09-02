import { Timestamp } from 'firebase/firestore';
import { Currency, ID } from './common.model';

export type TransactionType = 'debit' | 'credit' | 'transfer' | 'fee' | 'interest';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Transaction {
  id: ID;
  accountId: ID;
  userId: ID;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  description: string;
  category?: string;
  counterpartyName?: string;
  counterpartyIban?: string;
  reference?: string;
  createdAt?: Timestamp;
  processedAt?: Timestamp;
  metadata?: Record<string, any>;
}
