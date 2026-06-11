import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatMoney = (
  amount: number | string | undefined | null,
  currency: string = 'CNY',
  decimals: number = 2
): string => {
  if (amount === undefined || amount === null || amount === '') {
    return '-';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '-';
  }
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  switch (currency) {
    case 'CNY':
      return `¥${formatted}`;
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    default:
      return `${formatted} ${currency}`;
  }
};

export const formatDate = (
  date: string | number | Date | undefined | null,
  format: string = 'YYYY-MM-DD'
): string => {
  if (!date) {
    return '-';
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return '-';
  }
  return d.format(format);
};

export const formatDateTime = (
  date: string | number | Date | undefined | null,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  return formatDate(date, format);
};

export const formatRelativeTime = (
  date: string | number | Date | undefined | null
): string => {
  if (!date) {
    return '-';
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return '-';
  }
  const now = dayjs();
  const diff = now.diff(d, 'minute');
  if (diff < 1) {
    return '刚刚';
  }
  if (diff < 60) {
    return `${diff}分钟前`;
  }
  const diffHours = now.diff(d, 'hour');
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  const diffDays = now.diff(d, 'day');
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`;
  }
  if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)}个月前`;
  }
  return `${Math.floor(diffDays / 365)}年前`;
};

export const maskPhone = (phone: string | undefined | null): string => {
  if (!phone) {
    return '-';
  }
  if (phone.length < 7) {
    return phone;
  }
  return phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2');
};

export const maskIdCard = (idCard: string | undefined | null): string => {
  if (!idCard) {
    return '-';
  }
  if (idCard.length < 8) {
    return idCard;
  }
  return idCard.replace(/(\d{6})\d+(\d{4})/, '$1********$2');
};

export const maskName = (name: string | undefined | null): string => {
  if (!name) {
    return '-';
  }
  if (name.length <= 1) {
    return name;
  }
  if (name.length === 2) {
    return name.charAt(0) + '*';
  }
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
};

export const maskBankCard = (cardNo: string | undefined | null): string => {
  if (!cardNo) {
    return '-';
  }
  if (cardNo.length < 8) {
    return cardNo;
  }
  return cardNo.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
};

export const formatNumber = (
  num: number | string | undefined | null,
  decimals: number = 0
): string => {
  if (num === undefined || num === null || num === '') {
    return '-';
  }
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) {
    return '-';
  }
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (
  num: number | string | undefined | null,
  decimals: number = 2
): string => {
  if (num === undefined || num === null || num === '') {
    return '-';
  }
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) {
    return '-';
  }
  return `${(n * 100).toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number | undefined | null): string => {
  if (bytes === undefined || bytes === null) {
    return '-';
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

export const formatDuration = (minutes: number | undefined | null): string => {
  if (minutes === undefined || minutes === null) {
    return '-';
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
  if (remainingHours > 0 || mins > 0) {
    return `${days}天${remainingHours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  }
  return `${days}天`;
};
