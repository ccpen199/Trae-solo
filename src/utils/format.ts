import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatPrice = (price: number): string => {
  if (price >= 10000) {
    const wan = price / 10000;
    return `${wan.toFixed(wan >= 100 ? 0 : 2)}万`;
  }
  return `${price.toLocaleString('zh-CN')}元`;
};

export const formatPriceWithUnit = (price: number): string => {
  if (price >= 10000) {
    const wan = price / 10000;
    return `${wan.toFixed(wan >= 100 ? 0 : 2)}万元`;
  }
  return `${price.toLocaleString('zh-CN')}元`;
};

export const formatUnitPrice = (unitPrice: number | undefined): string => {
  if (!unitPrice) return '暂无';
  return `${unitPrice.toLocaleString('zh-CN')}元/㎡`;
};

export const formatArea = (area: number): string => {
  return `${area.toFixed(area % 1 === 0 ? 0 : 1)}㎡`;
};

export const formatDate = (
  dateString: string,
  pattern: string = 'yyyy-MM-dd'
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, pattern, { locale: zhCN });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, 'yyyy年MM月dd日 HH:mm');
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  } catch {
    return dateString;
  }
};

export const formatDistance = (distance: number): string => {
  if (distance >= 1000) {
    const km = distance / 1000;
    return `${km.toFixed(km >= 10 ? 0 : 1)}km`;
  }
  return `${Math.round(distance)}m`;
};

export const formatWalkTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatRooms = (
  rooms: number,
  halls: number,
  bathrooms?: number
): string => {
  let result = `${rooms}室${halls}厅`;
  if (bathrooms !== undefined) {
    result += `${bathrooms}卫`;
  }
  return result;
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatChangeRate = (changeRate: number): string => {
  const sign = changeRate >= 0 ? '+' : '';
  return `${sign}${changeRate.toFixed(2)}%`;
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

export const formatListingDays = (days: number): string => {
  if (days === 0) return '今日新上';
  if (days === 1) return '昨日新上';
  if (days < 7) return `${days}天前发布`;
  if (days < 30) return `${Math.floor(days / 7)}周前发布`;
  if (days < 365) return `${Math.floor(days / 30)}个月前发布`;
  return `${Math.floor(days / 365)}年前发布`;
};

export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString('zh-CN');
};
