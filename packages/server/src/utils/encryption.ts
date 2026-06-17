import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

let activeKey: Buffer | null = null;
let activeKeyVersion: number | null = null;

export function setEncryptionKey(keyHex: string, version: number) {
  activeKey = Buffer.from(keyHex, 'hex');
  activeKeyVersion = version;
}

function getActiveKey(): { key: Buffer; version: number } {
  if (!activeKey) {
    const fallbackKey = process.env.ENCRYPTION_FALLBACK_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    activeKey = Buffer.from(fallbackKey, 'hex');
    activeKeyVersion = 0;
  }
  return { key: activeKey, version: activeKeyVersion! };
}

export function encrypt(plaintext: string): string {
  const { key, version } = getActiveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const result = Buffer.concat([
    Buffer.from([version]),
    iv,
    tag,
    encrypted,
  ]);
  return result.toString('base64');
}

export function decrypt(ciphertextB64: string): string {
  const data = Buffer.from(ciphertextB64, 'base64');
  const version = data[0];
  const iv = data.slice(1, 1 + IV_LENGTH);
  const tag = data.slice(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.slice(1 + IV_LENGTH + TAG_LENGTH);
  const { key } = getActiveKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function hashValue(value: string, salt?: string): string {
  const actualSalt = salt || process.env.HASH_SALT || 'postal-gov-salt';
  return crypto
    .createHmac('sha256', actualSalt)
    .update(value)
    .digest('hex');
}

export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + (process.env.PASSWORD_PEPPER || 'pepper'))
    .digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
