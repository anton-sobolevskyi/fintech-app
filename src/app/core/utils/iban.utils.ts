const DEMO_BANK_CODE = '300001';

function mod97CheckDigits(country: string, bban: string): string {
  const rearranged = (bban + country + '00').toUpperCase();
  let expanded = '';
  for (const ch of rearranged) {
    if (ch >= 'A' && ch <= 'Z') {
      expanded += (ch.charCodeAt(0) - 55).toString(); // A=10 ... Z=35
    } else {
      expanded += ch;
    }
  }

  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    const block = remainder.toString() + expanded.slice(i, i + 7);
    remainder = Number(block) % 97;
  }

  const check = 98 - remainder;
  return check.toString().padStart(2, '0');
}

function accountNumberFromSeed(seed: string): string {
  const digits = seed.replace(/\D/g, '');
  const base = (
    digits +
    Date.now().toString() +
    Math.floor(Math.random() * 1e9).toString()
  ).replace(/\D/g, '');
  return base.padStart(19, '0').slice(0, 19);
}

export function generateUaIban(seed: string): string {
  const country = 'UA';
  const bban = DEMO_BANK_CODE + accountNumberFromSeed(seed);
  const check = mod97CheckDigits(country, bban);
  return `${country}${check}${bban}`;
}

export function isValidIban(iban: string): boolean {
  const normalized = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(normalized)) return false;
  if (normalized.length < 15 || normalized.length > 34) return false;

  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  let expanded = '';
  for (const ch of rearranged) {
    if (ch >= 'A' && ch <= 'Z') {
      expanded += (ch.charCodeAt(0) - 55).toString();
    } else {
      expanded += ch;
    }
  }

  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    const block = remainder.toString() + expanded.slice(i, i + 7);
    remainder = Number(block) % 97;
  }
  return remainder === 1;
}

export function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}
