import { TestBed } from '@angular/core/testing';
import { AccountOperationsService } from './account-operations.service';
import { FIREBASE_FUNCTIONS } from '../firebase';

describe('AccountOperationsService', () => {
  let service: AccountOperationsService;

  beforeEach(() => {
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
});
