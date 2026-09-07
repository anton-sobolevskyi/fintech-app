import { Timestamp } from 'firebase/firestore';
import { Currency, ID } from './common.model';

export type TransactionType = 'debit' | 'credit' | 'transfer' | 'fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Transaction {
  id: ID;
  accountId: ID;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  description: string;
  counterpartyIban?: string;
  createdAt?: Timestamp;
  processedAt?: Timestamp;
}
