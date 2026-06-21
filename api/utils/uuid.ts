export type UUIDFormat = 'standard' | 'no-hyphen' | 'uppercase' | 'braces' | 'urn';

export function v4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const toHex = (b: number): string => b.toString(16).padStart(2, '0');

    return (
      toHex(bytes[0]) +
      toHex(bytes[1]) +
      toHex(bytes[2]) +
      toHex(bytes[3]) +
      '-' +
      toHex(bytes[4]) +
      toHex(bytes[5]) +
      '-' +
      toHex(bytes[6]) +
      toHex(bytes[7]) +
      '-' +
      toHex(bytes[8]) +
      toHex(bytes[9]) +
      '-' +
      toHex(bytes[10]) +
      toHex(bytes[11]) +
      toHex(bytes[12]) +
      toHex(bytes[13]) +
      toHex(bytes[14]) +
      toHex(bytes[15])
    );
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function format(uuid: string, format: UUIDFormat = 'standard'): string {
  const clean = uuid.replace(/[{}urn:-]/gi, '').toLowerCase();

  if (clean.length !== 32) {
    throw new Error('Invalid UUID string: must be 32 hexadecimal characters');
  }

  const standard = `${clean.substring(0, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}-${clean.substring(16, 20)}-${clean.substring(20)}`;

  switch (format) {
    case 'no-hyphen':
      return clean;
    case 'uppercase':
      return standard.toUpperCase();
    case 'braces':
      return `{${standard}}`;
    case 'urn':
      return `urn:uuid:${standard}`;
    case 'standard':
    default:
      return standard;
  }
}

export function generate(fmt: UUIDFormat = 'standard'): string {
  return formatUUID(v4(), fmt);
}

export function formatUUID(uuid: string, fmt: UUIDFormat = 'standard'): string {
  const clean = uuid.replace(/[{}urn:-]/gi, '').toLowerCase();

  if (clean.length !== 32) {
    throw new Error('Invalid UUID string: must be 32 hexadecimal characters');
  }

  const standard = `${clean.substring(0, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}-${clean.substring(16, 20)}-${clean.substring(20)}`;

  switch (fmt) {
    case 'no-hyphen':
      return clean;
    case 'uppercase':
      return standard.toUpperCase();
    case 'braces':
      return `{${standard}}`;
    case 'urn':
      return `urn:uuid:${standard}`;
    case 'standard':
    default:
      return standard;
  }
}

export function isValid(uuid: string): boolean {
  const clean = uuid.replace(/[{}urn:-]/gi, '');
  if (clean.length !== 32) return false;
  const hexRegex = /^[0-9a-f]{32}$/i;
  if (!hexRegex.test(clean)) return false;
  const version = parseInt(clean.charAt(12), 16);
  if (version !== 4) return false;
  const variant = parseInt(clean.charAt(16), 16);
  return (variant & 0xc) === 0x8;
}

export function nil(): string {
  return '00000000-0000-0000-0000-000000000000';
}

export function isNil(uuid: string): boolean {
  return uuid === nil() || uuid.replace(/[{}urn:-]/gi, '') === '0'.repeat(32);
}

export function shortId(length = 8): string {
  if (length < 1 || length > 32) {
    throw new Error('Length must be between 1 and 32');
  }
  return v4().replace(/[{}urn:-]/gi, '').substring(0, length);
}

export function toTimestampUUID(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = shortId(6);
  return `${prefix}${timestamp}${randomPart}`;
}

export function compare(a: string, b: string): number {
  const cleanA = a.replace(/[{}urn:-]/gi, '').toLowerCase();
  const cleanB = b.replace(/[{}urn:-]/gi, '').toLowerCase();
  return cleanA.localeCompare(cleanB);
}

export function equals(a: string, b: string): boolean {
  return compare(a, b) === 0;
}

export function parse(uuid: string): Uint8Array {
  const clean = uuid.replace(/[{}urn:-]/gi, '');
  if (clean.length !== 32) {
    throw new Error('Invalid UUID');
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function stringify(bytes: Uint8Array, format: UUIDFormat = 'standard'): string {
  if (bytes.length !== 16) {
    throw new Error('Uint8Array must have 16 elements');
  }
  const toHex = (b: number): string => b.toString(16).padStart(2, '0');
  const hex = Array.from(bytes).map(toHex).join('');
  return formatUUID(hex, format);
}
