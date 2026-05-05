import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export function generateOrderNo(prefix: string = 'ORD'): string {
  const dateStr = format(new Date(), 'yyyyMMddHHmmss');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${dateStr}${randomStr}`;
}

export function generatePlanNo(): string {
  return generateOrderNo('DP');
}
