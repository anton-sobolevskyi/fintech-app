import { TestBed } from '@angular/core/testing';
import { FirestoreEntity, FirestoreService } from './firestore.service';

describe('FirestoreService', () => {
  let service: FirestoreService<FirestoreEntity>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FirestoreService],
    });
    service = TestBed.inject(FirestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
