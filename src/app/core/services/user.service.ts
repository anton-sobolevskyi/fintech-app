import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { User } from '../models';
import { Observable } from 'rxjs';

@Service()
export class UserService extends FirestoreService<User> {
  protected collectionName = 'users';

  getByRole(role: string): Observable<User[]> {
    return this.getAll([this.where('role', '==', role)]);
  }
}
