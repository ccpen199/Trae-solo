import crypto from 'crypto';

export function generateDeviceFingerprint(info: {
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  ip?: string;
}): string {
  const raw = [
    info.userAgent || '',
    info.screenResolution || '',
    info.timezone || '',
    info.language || '',
    info.platform || '',
  ].join('|');
  return crypto.createHash('md5').update(raw).digest('hex');
}

export function generateDeviceId(): string {
  return 'dev_' + crypto.randomBytes(16).toString('hex');
}

export function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}
