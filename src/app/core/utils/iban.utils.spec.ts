import { describe, expect, it } from 'vitest';
import { formatIban, generateUaIban, isValidIban } from './iban.utils';

describe('iban.utils', () => {
  describe('generateUaIban', () => {
    it('should generate a valid Ukrainian IBAN (UA + 27 digits)', () => {
      const iban = generateUaIban('user-1');
      expect(iban).toMatch(/^UA\d{27}$/);
      expect(isValidIban(iban)).toBe(true);
    });

    it('should generate a valid IBAN for an empty seed', () => {
      const iban = generateUaIban('');
      expect(isValidIban(iban)).toBe(true);
    });

    it('should generate valid IBANs for different seeds', () => {
      const a = generateUaIban('seed-a');
      const b = generateUaIban('seed-b');
      expect(isValidIban(a)).toBe(true);
      expect(isValidIban(b)).toBe(true);
    });
  });

  describe('isValidIban', () => {
    it('should accept a valid generated IBAN', () => {
      expect(isValidIban(generateUaIban('x'))).toBe(true);
    });

    it('should accept IBAN with spaces and lowercase letters', () => {
      const formatted = formatIban(generateUaIban('y'));
      // Lower-cased on purpose: the validator should normalize input.
      expect(isValidIban(formatted.toLowerCase())).toBe(true);
      expect(isValidIban(formatted)).toBe(true);
    });

    it('should reject strings that do not match the IBAN shape', () => {
      expect(isValidIban('not-an-iban')).toBe(false);
      expect(isValidIban('UA12345')).toBe(false);
      expect(isValidIban('11AA123456789012345678901234')).toBe(false);
    });

    it('should reject IBAN shorter than 15 characters', () => {
      expect(isValidIban('UA123456789012')).toBe(false);
    });

    it('should reject IBAN longer than 34 characters', () => {
      expect(isValidIban(`${'A1'.repeat(20)}X`)).toBe(false);
    });

    it('should reject a valid-shaped IBAN with wrong check digits', () => {
      // Take a generated IBAN and corrupt the check digits.
      const iban = generateUaIban('z');
      const corrupted = `${iban.slice(0, 2)}00${iban.slice(4)}`;
      expect(isValidIban(corrupted)).toBe(false);
    });
  });

  describe('formatIban', () => {
    it('should group digits in blocks of four separated by spaces', () => {
      expect(formatIban('UA1234567890')).toBe('UA12 3456 7890');
    });

    it('should normalize lowercase and spaces', () => {
      expect(formatIban('  ua12 3456 7890 ')).toBe('UA12 3456 7890');
    });

    it('should trim trailing separator when length is a multiple of 4', () => {
      expect(formatIban('UA12345678')).toBe('UA12 3456 78');
    });
  });
});