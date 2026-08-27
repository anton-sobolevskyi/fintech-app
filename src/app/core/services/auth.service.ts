import { Service, inject } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE } from '../firebase';
import { User } from '../models';

@Service()
export class AuthService {
  private auth = inject(FIREBASE_AUTH);
  private firestore = inject(FIRESTORE);

  login(email: string, password: string): Observable<FirebaseUser> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((credential) => credential.user),
    );
  }

  register(email: string, password: string, displayName: string): Observable<User> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        const firebaseUser = credential.user;
        await updateProfile(firebaseUser, { displayName });

        // 2. Create user profile in Firestore
        const userProfile: Omit<User, 'id'> = {
          email: firebaseUser.email!,
          displayName,
          role: 'viewer', // default role
          createdAt: serverTimestamp() as Timestamp,
          preferences: {
            theme: 'light',
            language: 'uk',
          },
        };

        await setDoc(doc(this.firestore, 'users', firebaseUser.uid), userProfile);

        // 3. Return the full user object
        return {
          id: firebaseUser.uid,
          ...userProfile,
        } satisfies User;
      }),
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  authState$(): Observable<FirebaseUser | null> {
    return new Observable((subscriber) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => subscriber.next(user),
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  loadUserProfile(uid: string): Observable<User | null> {
    const userRef = doc(this.firestore, 'users', uid);

    return from(getDoc(userRef)).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as User;
      }),
    );
  }

  currentUser$(): Observable<User | null> {
    return this.authState$().pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of(null);
        return this.loadUserProfile(firebaseUser.uid);
      }),
    );
  }
}
