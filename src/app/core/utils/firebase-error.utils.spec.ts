import { FirebaseError } from 'firebase/app';
import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage, isFirebaseError } from './firebase-error.utils';

describe('firebase-error.utils', () => {
  describe('isFirebaseError', () => {
    it('should return true for a FirebaseError', () => {
      const error = new FirebaseError('auth/invalid-email', 'bad email');
      expect(isFirebaseError(error)).toBe(true);
    });

    it('should return false for a plain Error', () => {
      expect(isFirebaseError(new Error('boom'))).toBe(false);
    });

    it('should return false for arbitrary values', () => {
      expect(isFirebaseError(null)).toBe(false);
      expect(isFirebaseError('auth/invalid-email')).toBe(false);
      expect(isFirebaseError({ code: 'auth/invalid-email' })).toBe(false);
    });
  });

  describe('getAuthErrorMessage', () => {
    it.each([
      ['auth/email-already-in-use', 'Try signing in instead'],
      ['auth/invalid-credential', 'Invalid email or password'],
      ['auth/invalid-email', 'Enter a valid email address'],
      ['auth/weak-password', 'Password is too weak'],
      ['auth/user-not-found', 'No account found with this email'],
      ['auth/wrong-password', 'Invalid email or password'],
      ['auth/too-many-requests', 'Too many attempts'],
      ['auth/network-request-failed', 'Network error'],
      ['auth/user-disabled', 'This account has been disabled'],
      ['auth/requires-recent-login', 'Please sign in again'],
    ])('should map %s to a user-friendly message', (code, expected) => {
      const message = getAuthErrorMessage(new FirebaseError(code, 'raw'));
      expect(message).toContain(expected);
      // The raw message must never leak through.
      expect(message).not.toContain('raw');
    });

    it('should fall back to a generic message for unknown Firebase codes', () => {
      const message = getAuthErrorMessage(new FirebaseError('auth/unknown-code', 'raw'));
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('should fall back to a generic message for non-Firebase errors', () => {
      expect(getAuthErrorMessage(new Error('boom'))).toBe(
        'Something went wrong. Please try again.',
      );
      expect(getAuthErrorMessage('boom')).toBe('Something went wrong. Please try again.');
    });
  });
});