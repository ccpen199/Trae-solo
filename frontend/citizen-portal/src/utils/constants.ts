export const PRIMARY_COLOR = '#1B5E20';
export const SECONDARY_COLOR = '#4CAF50';
export const BG_COLOR = '#F5F5F5';

export const API_PREFIX = '/api';

export const SERVICE_CATEGORIES = {
  GOVERNMENT: '政务服务',
  PAYMENT: '便民缴费',
  LIVING: '生活服务',
  SUBSIDY: '消费补贴',
} as const;

export const PAYMENT_TYPES = [
  { key: 'water', label: '水费', icon: '💧' },
  { key: 'electricity', label: '电费', icon: '⚡' },
  { key: 'gas', label: '燃气费', icon: '🔥' },
  { key: 'heating', label: '暖气费', icon: '🏠' },
] as const;

export const LIVING_CATEGORIES = [
  { key: 'housekeeping', label: '家政服务' },
  { key: 'renovation', label: '装修服务' },
  { key: 'transport', label: '出行预约' },
] as const;
