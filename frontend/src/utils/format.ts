import dayjs from 'dayjs';

export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatDateTime = (date: string | Date | undefined, format = 'YYYY-MM-DD HH:mm'): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDate = (date: string | Date | undefined): string => {
  return formatDateTime(date, 'YYYY-MM-DD');
};

export const formatTime = (date: string | Date | undefined): string => {
  return formatDateTime(date, 'HH:mm');
};

export const formatRelativeTime = (date: string | Date | undefined): string => {
  if (!date) return '-';
  const diff = dayjs().diff(dayjs(date), 'minute');
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}天前`;
  return formatDate(date);
};

export const formatPhone = (phone?: string): string => {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const formatDeviceCode = (code: string): string => {
  if (!code) return '-';
  if (code.length <= 8) return code;
  return code.slice(0, 4) + '...' + code.slice(-4);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
};

export const truncate = (text: string, maxLength = 20): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
