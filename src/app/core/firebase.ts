import { inject, InjectionToken } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';

import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

import { environment } from '../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  factory: () => initializeApp(environment.firebase),
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  factory: () => {
    const auth = getAuth(inject(FIREBASE_APP));
    if (!environment.production && environment.useEmulators) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    return auth;
  },
});

export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  factory: () => {
    const firestore = getFirestore(inject(FIREBASE_APP));
    if (!environment.production && environment.useEmulators) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
    return firestore;
  },
});

export const FIREBASE_FUNCTIONS = new InjectionToken<Functions>('FIREBASE_FUNCTIONS', {
  factory: () => {
    const functions = getFunctions(inject(FIREBASE_APP));
    if (!environment.production && environment.useEmulators) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
    return functions;
  },
});

export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FIREBASE_STORAGE', {
  factory: () => {
    const storage = getStorage(inject(FIREBASE_APP));
    if (!environment.production && environment.useEmulators) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
    return storage;
  },
});
