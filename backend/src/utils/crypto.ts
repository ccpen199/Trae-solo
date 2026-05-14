import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const hashUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const normalized = `${urlObj.origin}${urlObj.pathname}`;
    return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
  } catch {
    return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
  }
};
