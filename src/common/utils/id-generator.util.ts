import * as dayjs from 'dayjs';

export function generateApplicationNo(): string {
  const dateStr = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `GZ${dateStr}${random}`;
}

export function generateItemCode(category: string, seq: number): string {
  const prefix = 'GZ';
  const catCode = category.substring(0, 2).toUpperCase().padEnd(2, '0');
  const seqStr = String(seq).padStart(6, '0');
  return `${prefix}${catCode}${seqStr}`;
}

export function generateCertNo(deptCode: string, type: string): string {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `${deptCode}${type}${dateStr}${random}`;
}

export function generateAppId(): string {
  return 'gz_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(-6);
}

export function generateAppSecret(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
