import { FirebaseError } from 'firebase/app';

/** Type guard to check whether an unknown error is a Firebase error. */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return error instanceof FirebaseError;
}

/** User-friendly messages for known Firebase Auth error codes. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Password is too weak (minimum 6 characters).',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
};

/**
 * Converts an unknown error into a user-friendly message.
 * Firebase errors are mapped by their `code`; anything else
 * falls back to a generic message.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (isFirebaseError(error)) {
    return AUTH_ERROR_MESSAGES[error.code] ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
