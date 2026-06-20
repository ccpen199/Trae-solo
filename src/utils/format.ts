import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export const formatDate = (
  date: string | Date | number | undefined,
  pattern: string = 'YYYY-MM-DD'
): string => {
  if (!date) {
    return '';
  }
  return dayjs(date).format(pattern);
};

export const formatDateTime = (
  date: string | Date | number | undefined
): string => {
  if (!date) {
    return '';
  }
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatTime = (
  date: string | Date | number | undefined
): string => {
  if (!date) {
    return '';
  }
  return dayjs(date).format('HH:mm:ss');
};

export const formatRelativeTime = (
  date: string | Date | number | undefined
): string => {
  if (!date) {
    return '';
  }
  return dayjs(date).fromNow();
};

export const formatCurrency = (
  amount: number | string | undefined,
  currency: string = '¥'
): string => {
  if (amount === undefined || amount === null || amount === '') {
    return `${currency}0.00`;
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return `${currency}0.00`;
  }
  return `${currency}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const formatNumber = (
  num: number | string | undefined,
  decimals: number = 0
): string => {
  if (num === undefined || num === null || num === '') {
    return '0';
  }
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) {
    return '0';
  }
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatDuration = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null || isNaN(minutes)) {
    return '0分钟';
  }
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
};

export const formatWorkOrderNo = (
  id: string | number | undefined,
  prefix: string = 'WO'
): string => {
  if (!id) {
    return '';
  }
  const dateStr = dayjs().format('YYYYMMDD');
  const paddedId = String(id).padStart(6, '0');
  return `${prefix}${dateStr}${paddedId}`;
};

export const formatPercent = (
  value: number | string | undefined,
  decimals: number = 2
): string => {
  if (value === undefined || value === null || value === '') {
    return '0%';
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return '0%';
  }
  return `${num.toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number | undefined): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
