import dayjs from 'dayjs';
import { randomUUID } from 'crypto';
import { ORDER_NO_PREFIX, CONSULTATION_ORDER_NO_PREFIX, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from './constants';
import type { PaginationParams, PaginationResult, ListQueryParams } from './types';
import { paginationSchema, listQuerySchema } from './schemas';

export function generateOrderNo(): string {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${ORDER_NO_PREFIX}${timestamp}${random}`;
}

export function generateConsultationOrderNo(): string {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${CONSULTATION_ORDER_NO_PREFIX}${timestamp}${random}`;
}

export function generateUUID(): string {
  return randomUUID();
}

export function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) {
      code += '-';
    }
  }
  return code;
}

export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const maskedName = name.length > 2
    ? name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
    : '*'.repeat(name.length);
  return `${maskedName}@${domain}`;
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

export function formatDate(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format);
}

export function formatRelativeTime(date: Date | string): string {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return target.format('YYYY-MM-DD');
}

export function getPaginationParams(query: Record<string, unknown>): PaginationParams {
  const result = paginationSchema.safeParse(query);
  if (result.success) {
    return result.data;
  }
  return {
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function getListQueryParams(query: Record<string, unknown>): ListQueryParams {
  const result = listQuerySchema.safeParse(query);
  if (result.success) {
    return result.data;
  }
  return {
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    keyword: undefined,
    sortBy: undefined,
    sortOrder: 'desc',
  };
}

export function buildPaginationResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginationResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function generateCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}${parts.join(':')}`;
}

export function buildTree<T extends { id: string; parentId?: string | null; children?: T[] }>(
  items: T[],
  parentId: string | null = null
): T[] {
  return items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id),
    }));
}

export function flattenTree<T extends { children?: T[] }>(tree: T[]): T[] {
  const result: T[] = [];
  for (const node of tree) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

export function calculateDiscount(originalPrice: number, discountRate: number): number {
  return Math.round(originalPrice * discountRate * 100) / 100;
}

export function isBetween<T>(value: T, min: T, max: T): boolean {
  return value >= min && value <= max;
}

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function extractKeywords(text: string): string[] {
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/).filter(word => word.length > 1);
  return [...new Set(words)];
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function weightedRandom<T extends { probability: number }>(items: T[]): T | null {
  const total = items.reduce((sum, item) => sum + item.probability, 0);
  if (total === 0) return null;

  let random = Math.random() * total;
  for (const item of items) {
    random -= item.probability;
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1] || null;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
