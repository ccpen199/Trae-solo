import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateAPIKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'agk-' + crypto.randomBytes(4).toString('hex');
  const key = prefix + '-' + crypto.randomBytes(24).toString('hex');
  const hash = hashAPIKey(key);
  return { key, prefix, hash };
}

export function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function verifyAPIKey(key: string, expectedHash: string): boolean {
  return hashAPIKey(key) === expectedHash;
}

export function generateRequestFingerprint(
  method: string,
  path: string,
  headers: Record<string, string | string[] | undefined>,
  body?: string
): string {
  const relevantHeaders = [
    headers['content-type'] ? String(headers['content-type']) : '',
    headers['accept'] ? String(headers['accept']) : '',
    headers['user-agent'] ? String(headers['user-agent']) : '',
  ].join('|');
  
  const content = `${method}|${path}|${relevantHeaders}|${body || ''}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function generateTraceId(): string {
  const timestamp = Date.now().toString(16);
  const random = crypto.randomBytes(12).toString('hex');
  return timestamp + random;
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}min`;
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function calculateSuccessRate(successCount: number, totalCount: number): number {
  if (totalCount === 0) return 100;
  return (successCount / totalCount) * 100;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
