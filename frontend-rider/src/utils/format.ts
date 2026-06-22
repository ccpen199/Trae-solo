import dayjs from 'dayjs';
import type { OrderType, OrderStatus } from '@shared/types';

export const formatOrderType = (type: OrderType): string => {
  const typeMap: Record<OrderType, string> = {
    express: '快递',
    takeout: '外卖',
    grocery: '生鲜',
    medicine: '药品',
    document: '文件',
    other: '其他',
    delivery: '快递',
    pickup: '取件',
    errands: '跑腿',
    shopping: '代购',
  };
  return typeMap[type] || type;
};

export const formatOrderStatus = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: '待接单',
    accepted: '已接单',
    picking_up: '取货中',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消',
    exception: '异常终止',
  };
  return statusMap[status] || status;
};

export const getStatusClass = (status: OrderStatus): string => {
  const classMap: Record<OrderStatus, string> = {
    pending: 'status-pending',
    accepted: 'status-accepted',
    picking_up: 'status-picking',
    delivering: 'status-delivering',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    exception: 'status-exception',
  };
  return classMap[status] || 'status-pending';
};

export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}米`;
  }
  return `${(distance / 1000).toFixed(1)}公里`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分钟`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${minutes}分钟`;
};

export const formatTime = (date: Date | string | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatTimeAgo = (date: Date | string | undefined): string => {
  if (!date) return '-';
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'minute');

  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  return `${Math.floor(diff / 1440)}天前`;
};

export const formatAmount = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '-';
  return `¥${amount.toFixed(2)}`;
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
