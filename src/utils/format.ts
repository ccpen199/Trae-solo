import dayjs from 'dayjs';

export function formatMoney(amount: number | string | undefined, decimals: number = 2): string {
  if (amount === undefined || amount === null) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMoneyWithSign(amount: number | undefined): string {
  if (amount === undefined) return '-';
  const sign = amount >= 0 ? '' : '-';
  return `${sign}¥${formatMoney(Math.abs(amount))}`;
}

export function formatDate(date: string | Date | undefined, format: string = 'YYYY-MM-DD'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date | undefined): string {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
}

export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return '-';
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, 'day');
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function formatIdCard(id: string | undefined): string {
  if (!id) return '-';
  if (id.length < 8) return id;
  return `${id.slice(0, 6)}********${id.slice(-4)}`;
}

export function formatPhone(phone: string | undefined): string {
  if (!phone) return '-';
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function truncateText(text: string | undefined, maxLength: number = 50): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function formatPercent(value: number | undefined, decimals: number = 1): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(decimals)}%`;
}

export function getDaysBetween(start: string | Date, end: string | Date): number {
  return dayjs(end).diff(dayjs(start), 'day');
}

export function isOverdue(date: string | Date | undefined): boolean {
  if (!date) return false;
  return dayjs(date).isBefore(dayjs(), 'day');
}

export function isUpcoming(date: string | Date | undefined, days: number = 7): boolean {
  if (!date) return false;
  const target = dayjs(date);
  const now = dayjs();
  return target.isAfter(now) && target.diff(now, 'day') <= days;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function downloadFile(content: string | Blob, filename: string, type: string = 'text/plain'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
