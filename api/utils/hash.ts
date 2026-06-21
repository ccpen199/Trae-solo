import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateTransactionHash(
  id: string,
  studentId: string,
  deviceId: string,
  startTime: number,
  volume: number,
  amount: number,
  prevHash: string | null
): string {
  const data = `${id}|${studentId}|${deviceId}|${startTime}|${volume.toFixed(4)}|${amount.toFixed(2)}|${prevHash || 'GENESIS'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function verifyTransactionHash(
  id: string,
  studentId: string,
  deviceId: string,
  startTime: number,
  volume: number,
  amount: number,
  prevHash: string | null,
  expectedHash: string
): boolean {
  const actualHash = generateTransactionHash(id, studentId, deviceId, startTime, volume, amount, prevHash);
  return actualHash === expectedHash;
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}_${Date.now().toString(36)}`;
}
