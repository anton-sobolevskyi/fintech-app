import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_FUNCTIONS } from '../firebase';
import { AccountOperationsService } from './account-operations.service';

const functionsMocks = vi.hoisted(() => ({
  httpsCallable: vi.fn(),
}));

vi.mock('firebase/functions', () => functionsMocks);

describe('AccountOperationsService', () => {
  let service: AccountOperationsService;
  let call: ReturnType<typeof vi.fn>;

  const callableResponse = { data: { success: true, accountId: 'acc-1', iban: 'UA123' } };

  beforeEach(() => {
    vi.clearAllMocks();
    call = vi.fn().mockResolvedValue(callableResponse);
    functionsMocks.httpsCallable.mockImplementation((_functions: unknown, name: string) => {
      expect(name).toBeDefined();
      return call;
    });

    TestBed.configureTestingModule({
      providers: [
        AccountOperationsService,
        { provide: FIREBASE_FUNCTIONS, useValue: {} },
      ],
    });
    service = TestBed.inject(AccountOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createAccount should call the matching function and return data', async () => {
    const payload = {
      name: 'Main',
      type: 'checking',
      currency: 'UAH',
      balance: 0,
      availableBalance: 0,
      status: 'active',
    };
    const result = await firstValueFrom(service.createAccount(payload));
    expect(functionsMocks.httpsCallable).toHaveBeenCalledWith({}, 'createAccount');
    expect(call).toHaveBeenCalledWith(payload);
    expect(result).toEqual(callableResponse.data);
  });

  it('topUp should call the matching function and echo inputs', async () => {
    const result = await firstValueFrom(service.topUp('acc-1', 500));
    expect(functionsMocks.httpsCallable).toHaveBeenCalledWith({}, 'topUpAccount');
    expect(call).toHaveBeenCalledWith({ accountId: 'acc-1', amount: 500 });
    expect(result).toEqual({ accountId: 'acc-1', amount: 500 });
  });

  it('lookupByIban should call the matching function and return data', async () => {
    const result = await firstValueFrom(service.lookupByIban('UA123'));
    expect(functionsMocks.httpsCallable).toHaveBeenCalledWith({}, 'lookupAccountByIban');
    expect(call).toHaveBeenCalledWith({ iban: 'UA123' });
    expect(result).toEqual(callableResponse.data);
  });

  it('transfer should call the matching function and echo inputs', async () => {
    const result = await firstValueFrom(service.transfer('from-1', 'UA123', 100));
    expect(functionsMocks.httpsCallable).toHaveBeenCalledWith({}, 'transferFunds');
    expect(call).toHaveBeenCalledWith({ fromAccountId: 'from-1', toIban: 'UA123', amount: 100 });
    expect(result).toEqual({ fromAccountId: 'from-1', toIban: 'UA123', amount: 100 });
  });
});
