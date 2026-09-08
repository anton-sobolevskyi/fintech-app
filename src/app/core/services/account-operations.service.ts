import { inject, Service } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FIREBASE_FUNCTIONS } from '../firebase';

export interface AccountByIbanInfo {
  name: string;
  type: string;
  currency: string;
  status: string;
  isOwn: boolean;
  ownerName: string;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: string;
}

export interface CreateAccountResponse {
  success: boolean;
  accountId: string;
  iban: string;
}

@Service()
export class AccountOperationsService {
  private functions = inject(FIREBASE_FUNCTIONS);

  createAccount(data: CreateAccountRequest): Observable<CreateAccountResponse> {
    const call = httpsCallable<CreateAccountRequest, CreateAccountResponse>(
      this.functions,
      'createAccount',
    );
    return from(call(data)).pipe(map((result) => result.data));
  }

  topUp(accountId: string, amount: number): Observable<void> {
    const call = httpsCallable<{ accountId: string; amount: number }>(
      this.functions,
      'topUpAccount',
    );
    return from(call({ accountId, amount })).pipe(map(() => void 0));
  }

  lookupByIban(iban: string): Observable<AccountByIbanInfo> {
    const call = httpsCallable<{ iban: string }, AccountByIbanInfo>(
      this.functions,
      'lookupAccountByIban',
    );
    return from(call({ iban })).pipe(map((result) => result.data));
  }

  transfer(fromAccountId: string, toIban: string, amount: number): Observable<void> {
    const call = httpsCallable<{
      fromAccountId: string;
      toIban: string;
      amount: number;
    }>(this.functions, 'transferFunds');
    return from(call({ fromAccountId, toIban, amount })).pipe(map(() => void 0));
  }
}
