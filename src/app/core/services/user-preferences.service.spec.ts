import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRESTORE } from '../firebase';
import { UserPreferencesService } from './user-preferences.service';

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.doc.mockReturnValue({ path: 'userPreferences/u1' });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    firestoreMocks.serverTimestamp.mockReturnValue({ serverTimestamp: true });

    TestBed.configureTestingModule({
      providers: [{ provide: FIRESTORE, useValue: {} }, UserPreferencesService],
    });
    service = TestBed.inject(UserPreferencesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should return the stored preferences when the document exists', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'u1',
        data: () => ({ theme: 'dark', language: 'uk' }),
      });
      const prefs = await new Promise<unknown>((resolve, reject) => {
        service.load('u1').subscribe({ next: resolve, error: reject });
      });
      expect(prefs).toEqual({ id: 'u1', theme: 'dark', language: 'uk' });
    });

    it('should create defaults and return them for a missing document', async () => {
      const prefs = await new Promise<unknown>((resolve, reject) => {
        service.load('u1').subscribe({ next: resolve, error: reject });
      });
      expect(firestoreMocks.doc).toHaveBeenCalledWith({}, 'userPreferences', 'u1');
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { path: 'userPreferences/u1' },
        { theme: 'system', language: 'en', createdAt: { serverTimestamp: true } },
      );
      expect(prefs).toEqual({ id: 'u1', theme: 'system', language: 'en' });
    });
  });

  describe('save', () => {
    it('should merge partial updates with an updatedAt timestamp', async () => {
      await new Promise<void>((resolve) => {
        service.save('u1', { theme: 'dark' }).subscribe(() => resolve());
      });
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { path: 'userPreferences/u1' },
        { theme: 'dark', updatedAt: { serverTimestamp: true } },
        { merge: true },
      );
    });
  });
});