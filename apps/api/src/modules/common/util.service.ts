import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';
import { nanoid } from 'nanoid';

@Injectable()
export class UtilService {
  generateUUID(): string {
    return uuidv4();
  }

  generateNanoId(length = 21): string {
    return nanoid(length);
  }

  generateOrderNo(prefix = 'ORD'): string {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }

  generateRandomString(length: number, chars?: string): string {
    const characters =
      chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateOTP(length = 6): string {
    return this.generateRandomString(length, '0123456789');
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    const maskedUsername =
      username.length <= 2
        ? username[0] + '*'
        : username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  }

  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 15) return idCard;
    return idCard.replace(/(\d{6})\d+(\d{4})/, '$1********$2');
  }

  maskBankCard(cardNo: string): string {
    if (!cardNo || cardNo.length < 16) return cardNo;
    return cardNo.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
  }

  formatDate(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(date).format(format);
  }

  relativeTime(date: Date | string | number): string {
    return dayjs(date).fromNow();
  }

  startOfDay(date?: Date | string | number): Date {
    return dayjs(date).startOf('day').toDate();
  }

  endOfDay(date?: Date | string | number): Date {
    return dayjs(date).endOf('day').toDate();
  }

  startOfMonth(date?: Date | string | number): Date {
    return dayjs(date).startOf('month').toDate();
  }

  endOfMonth(date?: Date | string | number): Date {
    return dayjs(date).endOf('month').toDate();
  }

  isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
    return dayjs(date1).isSame(date2, 'day');
  }

  addDays(date: Date | string | number, days: number): Date {
    return dayjs(date).add(days, 'day').toDate();
  }

  diffDays(date1: Date | string | number, date2: Date | string | number): number {
    return dayjs(date1).diff(date2, 'day');
  }

  parseQueryInt(value: string | undefined, defaultValue: number): number {
    const parsed = parseInt(value || '', 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  parseQueryBoolean(value: string | undefined, defaultValue = false): boolean {
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  buildPagination(page: number, pageSize: number, total: number) {
    const totalPages = Math.ceil(total / pageSize);
    return {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  removeEmptyValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key as keyof T] = value as T[keyof T];
      }
    }
    return result;
  }

  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
  ): Promise<T> {
    return fn().catch(async (error) => {
      if (retries <= 0) throw error;
      await this.sleep(delay);
      return this.retry(fn, retries - 1, delay * 2);
    });
  }

  truncate(str: string, maxLength: number, suffix = '...'): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  }

  toCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', ''),
    );
  }

  toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  validatePhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  validateEmail(email: string): boolean {
    return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email);
  }

  validateIdCard(idCard: string): boolean {
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
  }
}
