import { Service, inject } from '@angular/core';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '../models';

@Service()
export class UserPreferencesService extends FirestoreService<UserPreferences> {
  protected collectionName = 'userPreferences';

  /**
   * Loads preferences for a user. Lazily creates the document with
   * defaults on first access so every user always has preferences.
   */
  load(uid: string): Observable<UserPreferences> {
    const ref = doc(this.firestore, this.collectionName, uid);

    return from(getDoc(ref)).pipe(
      switchMap((snapshot) => {
        if (snapshot.exists()) {
          return of({ id: snapshot.id, ...snapshot.data() } as UserPreferences);
        }

        return from(
          setDoc(ref, { ...DEFAULT_USER_PREFERENCES, createdAt: serverTimestamp() }),
        ).pipe(map(() => ({ id: uid, ...DEFAULT_USER_PREFERENCES }) as UserPreferences));
      }),
    );
  }

  /**
   * Partially updates preferences. Uses merge so the document is
   * created if it does not exist yet.
   */
  save(uid: string, prefs: Partial<Omit<UserPreferences, 'id'>>): Observable<void> {
    const ref = doc(this.firestore, this.collectionName, uid);
    return from(setDoc(ref, { ...prefs, updatedAt: serverTimestamp() }, { merge: true }));
  }
}
