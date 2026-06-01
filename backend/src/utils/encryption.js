const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

function encrypt(plaintext, masterKey) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

function decrypt(ciphertext, masterKey) {
  const buffer = Buffer.from(ciphertext, 'base64');
  
  let offset = 0;
  const salt = buffer.slice(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  
  const iv = buffer.slice(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  
  const tag = buffer.slice(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;
  
  const encrypted = buffer.slice(offset);
  
  const key = deriveKey(masterKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

function maskValue(value, type = 'password') {
  if (!value) return '****';
  const len = value.length;
  if (len <= 4) return '*'.repeat(len);
  
  switch (type) {
    case 'email':
      const [user, domain] = value.split('@');
      return `${user.charAt(0)}${'*'.repeat(Math.max(0, user.length - 2))}${user.slice(-1)}@${domain}`;
    case 'phone':
      return `${value.slice(0, 3)}${'*'.repeat(len - 7)}${value.slice(-4)}`;
    case 'token':
      return `${value.slice(0, 8)}${'*'.repeat(16)}${value.slice(-8)}`;
    case 'password':
    default:
      return `${value.slice(0, 2)}${'*'.repeat(Math.min(12, len - 4))}${value.slice(-2)}`;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, hashed) {
  const [salt, hash] = hashed.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return hash === verifyHash;
}

function generateApiKey() {
  return 'vk_' + crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  maskValue,
  hashPassword,
  verifyPassword,
  generateApiKey
};
