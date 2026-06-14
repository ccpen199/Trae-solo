// 通用工具函数
import dayjs from 'dayjs';

/**
 * 数据脱敏工具函数
 */
export const maskUtils = {
  /**
   * 姓名脱敏：张*三、张**
   */
  maskName(name: string): string {
    if (!name || name.length <= 1) return name || '';
    if (name.length === 2) return name.charAt(0) + '*';
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
  },

  /**
   * 身份证脱敏：450***********1234
   */
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 8) return idCard || '';
    return idCard.substring(0, 3) + '*'.repeat(idCard.length - 7) + idCard.substring(idCard.length - 4);
  },

  /**
   * 手机号脱敏：138****1234
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone || '';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  },

  /**
   * 银行卡号脱敏：6225 **** **** 1234
   */
  maskBankCard(cardNo: string): string {
    if (!cardNo || cardNo.length < 8) return cardNo || '';
    const first4 = cardNo.substring(0, 4);
    const last4 = cardNo.substring(cardNo.length - 4);
    return `${first4} **** **** ${last4}`;
  },

  /**
   * 社保卡号脱敏：S12****3456
   */
  maskSocialCard(cardNo: string): string {
    if (!cardNo || cardNo.length < 6) return cardNo || '';
    return cardNo.substring(0, 2) + '****' + cardNo.substring(cardNo.length - 4);
  }
};

/**
 * 金额格式化
 */
export const formatCurrency = (amount: number | undefined | null, currency: string = 'CNY'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '-';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * 百分比格式化
 */
export const formatPercent = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null || isNaN(value)) return '-%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * 数字格式化（千分位）
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return new Intl.NumberFormat('zh-CN').format(num);
};

/**
 * 日期格式化
 */
export const formatDate = (date: string | Date | number, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

/**
 * 日期时间格式化
 */
export const formatDateTime = (date: string | Date | number): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 计算两个日期之间的天数差
 */
export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

/**
 * 生成随机UUID
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}
