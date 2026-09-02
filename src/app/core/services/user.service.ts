import { Service } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { User, UserRole } from '../models';
import { Observable } from 'rxjs';

@Service()
export class UserService extends FirestoreService<User> {
  protected collectionName = 'users';

  getAllUsers(): Observable<User[]> {
    return this.getAll([this.orderBy('createdAt', 'desc')]);
  }

  getByRole(role: UserRole): Observable<User[]> {
    return this.getAll([this.where('role', '==', role), this.orderBy('createdAt', 'desc')]);
  }
}
