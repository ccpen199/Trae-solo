
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'referral_platform_encryption_key_32bytes';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted: encrypted,
    iv: iv.toString('hex')
  };
}

function decrypt(encryptedText, ivHex) {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function hashContent(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = { encrypt, decrypt, hashContent };
