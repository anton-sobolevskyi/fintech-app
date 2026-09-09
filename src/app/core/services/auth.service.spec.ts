import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_AUTH, FIRESTORE } from '../firebase';
import { AuthService } from './auth.service';

const authMocks = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => authMocks);
vi.mock('firebase/firestore', () => firestoreMocks);

const firebaseUser = {
  uid: 'u1',
  email: 'a@b.com',
  displayName: 'Alice',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
    authMocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
    authMocks.signOut.mockResolvedValue(undefined);
    authMocks.updateProfile.mockResolvedValue(undefined);
    authMocks.onAuthStateChanged.mockImplementation(
      (_auth: unknown, next: (u: unknown) => void) => {
        next(null);
        return () => undefined;
      },
    );
    firestoreMocks.doc.mockReturnValue({ path: 'users/u1' });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    firestoreMocks.serverTimestamp.mockReturnValue({ serverTimestamp: true });
    firestoreMocks.setDoc.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: FIREBASE_AUTH, useValue: {} },
        { provide: FIRESTORE, useValue: {} },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should sign in and return the Firebase user', async () => {
      const user = await new Promise<unknown>((resolve, reject) => {
        service.login('a@b.com', 'pw').subscribe({ next: resolve, error: reject });
      });
      expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.com', 'pw');
      expect(user).toEqual(firebaseUser);
    });
  });

  describe('register', () => {
    it('should create the user, update the profile and write the Firestore document', async () => {
      const user = await new Promise<unknown>((resolve, reject) => {
        service.register('a@b.com', 'pw', 'Alice').subscribe({ next: resolve, error: reject });
      });
      expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.com', 'pw');
      expect(authMocks.updateProfile).toHaveBeenCalledWith(firebaseUser, { displayName: 'Alice' });
      expect(firestoreMocks.doc).toHaveBeenCalledWith({}, 'users', 'u1');
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { path: 'users/u1' },
        {
          email: 'a@b.com',
          displayName: 'Alice',
          role: 'client',
          createdAt: { serverTimestamp: true },
        },
      );
      expect(user).toEqual({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Alice',
        role: 'client',
      });
    });

    it('should propagate registration errors', async () => {
      authMocks.createUserWithEmailAndPassword.mockRejectedValue(new Error('no'));
      const errors: unknown[] = [];
      service.register('a@b.com', 'pw', 'Alice').subscribe({ error: (e) => errors.push(e) });
      await new Promise((r) => setTimeout(r));
      expect(errors).toHaveLength(1);
    });
  });

  describe('logout', () => {
    it('should sign out', async () => {
      await new Promise<void>((resolve) => service.logout().subscribe(() => resolve()));
      expect(authMocks.signOut).toHaveBeenCalledWith({});
    });
  });

  describe('updateAuthPhoto', () => {
    it('should update the profile photo for a signed-in user', async () => {
      (service as unknown as { auth: { currentUser: unknown } }).auth = {
        currentUser: firebaseUser,
      };
      await new Promise<void>((resolve) =>
        service.updateAuthPhoto('https://photo').subscribe(() => resolve()),
      );
      expect(authMocks.updateProfile).toHaveBeenCalledWith(firebaseUser, {
        photoURL: 'https://photo',
      });
    });

    it('should throw when there is no current user', () => {
      (service as unknown as { auth: { currentUser: null } }).auth = { currentUser: null };
      const errors: unknown[] = [];
      service.updateAuthPhoto('https://photo').subscribe({ error: (e) => errors.push(e) });
      expect(errors[0]).toMatchObject({ message: 'Not authenticated' });
    });
  });

  describe('authState$', () => {
    it('should emit the firebase user when the auth state changes', () => {
      let next!: (user: unknown) => void;
      let onError!: (e: unknown) => void;
      authMocks.onAuthStateChanged.mockImplementation(
        (_auth: unknown, cb: (u: unknown) => void, err: (e: unknown) => void) => {
          next = cb;
          onError = err;
          return () => undefined;
        },
      );
      const values: unknown[] = [];
      service.authState$().subscribe((v) => values.push(v));
      next!(firebaseUser);
      expect(values).toEqual([firebaseUser]);
    });

    it('should forward auth state errors', () => {
      let onError!: (e: unknown) => void;
      authMocks.onAuthStateChanged.mockImplementation(
        (_auth: unknown, _cb: (u: unknown) => void, err: (e: unknown) => void) => {
          onError = err;
          return () => undefined;
        },
      );
      const errors: unknown[] = [];
      service.authState$().subscribe({ error: (e) => errors.push(e) });
      onError!('auth-error');
      expect(errors).toEqual(['auth-error']);
    });
  });

  describe('loadUserProfile', () => {
    it('should return the profile when the document exists', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'u1',
        data: () => ({ email: 'a@b.com', role: 'client' }),
      });
      const user = await new Promise<unknown>((resolve, reject) => {
        service.loadUserProfile('u1').subscribe({ next: resolve, error: reject });
      });
      expect(user).toEqual({ id: 'u1', email: 'a@b.com', role: 'client' });
    });

    it('should return null when the document is missing', async () => {
      const user = await new Promise<unknown>((resolve, reject) => {
        service.loadUserProfile('u1').subscribe({ next: resolve, error: reject });
      });
      expect(user).toBeNull();
    });
  });

  describe('currentUser$', () => {
    it('should return null when no Firebase user is signed in', async () => {
      const user = await new Promise<unknown>((resolve, reject) => {
        service.currentUser$().subscribe({ next: resolve, error: reject });
      });
      expect(user).toBeNull();
    });

    it('should load the profile for a signed-in Firebase user', async () => {
      let next!: (u: unknown) => void;
      authMocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
        next = cb;
        return () => undefined;
      });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'u1',
        data: () => ({ displayName: 'Alice' }),
      });
      const values: unknown[] = [];
      service.currentUser$().subscribe((v) => values.push(v));
      next!(firebaseUser);
      await new Promise((r) => setTimeout(r));
      expect(values).toEqual([{ id: 'u1', displayName: 'Alice' }]);
    });
  });
});
